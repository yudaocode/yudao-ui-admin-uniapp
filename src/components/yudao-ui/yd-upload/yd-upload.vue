<template>
  <view class="w-full">
    <wd-upload
      v-model:file-list="innerFileList"
      :upload-method="customUpload"
      :accept="accept"
      :multiple="multiple"
      :limit="limit"
      :disabled="disabled"
      :max-size="maxSizeBytes"
      :before-upload="beforeUpload"
      :image-mode="imageMode"
      @change="handleChange"
      @oversize="handleOversize"
      @success="handleSuccess"
      @fail="handleFail"
      @remove="handleRemove"
    >
      <!-- 透传自定义占位（如文件上传用文件图标替代默认相机图标） -->
      <template v-if="$slots.default" #default>
        <slot />
      </template>
    </wd-upload>
  </view>
</template>

<script lang="ts" setup>
import type { ImageMode } from '@wot-ui/ui/components/wd-img/types'
import type { UploadBeforeUpload, UploadFile, UploadFileItem, UploadFileType, UploadMethod } from '@wot-ui/ui/components/wd-upload/types'
import { computed, ref, watch } from 'vue'
import { uploadFileFromPath } from '@/utils/uploadFile'

const props = withDefaults(defineProps<{
  modelValue?: string[] // 已上传文件的访问地址数组
  directory?: string // 上传目录
  accept?: UploadFileType // 文件类型：image 图片 / all 任意文件 / file 文件 等
  multiple?: boolean // 是否多选
  limit?: number // 最大上传数量
  disabled?: boolean // 是否禁用
  fileSize?: number // 单文件大小限制（MB），不传则不限制
  fileType?: string[] // 允许的类型/扩展名，为空则不限制
  imageMode?: ImageMode // 图片预览裁剪模式
}>(), {
  modelValue: () => [],
  directory: '',
  accept: 'image',
  multiple: true,
  limit: 5,
  disabled: false,
  fileType: () => [],
  imageMode: 'aspectFill',
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'uploaded': [value: string, name?: string]
  'success': [value: any]
  'fail': [value: any]
  'remove': [value: any]
}>()

// 内部文件列表（含上传中/失败状态），由 wd-upload 双向维护；
// 避免上传过程中因外部 modelValue 回流而重置列表、打断仍在上传的文件
const innerFileList = ref<UploadFile[]>([])
const maxSizeBytes = computed(() => (props.fileSize && props.fileSize > 0 ? props.fileSize * 1024 * 1024 : Number.MAX_VALUE))

/** 解析文件名 */
function getFileName(url: string) {
  if (!url) {
    return ''
  }
  const path = url.split('?')[0]
  return decodeURIComponent(path.slice(Math.max(0, path.lastIndexOf('/') + 1))) || '附件'
}

/** 解析单个文件的访问地址 */
function resolveUrl(item: UploadFileItem) {
  if (item.response) {
    try {
      const response = typeof item.response === 'string' ? JSON.parse(item.response) : item.response
      return response?.data || item.url
    } catch {
      return item.url
    }
  }
  return item.url
}

/** 取已上传成功的访问地址 */
function successUrls(list: UploadFile[]) {
  return list
    .filter(item => item.status === 'success')
    .map(item => resolveUrl(item as UploadFileItem))
    .filter(Boolean)
}

// 外部 modelValue → 内部列表：仅当地址集合不一致（外部 reset/回显）时重建，
// 内部上传成功回流时集合一致，跳过，从而不打断仍在上传中的文件
watch(
  () => props.modelValue,
  (val) => {
    const urls = val || []
    const current = successUrls(innerFileList.value)
    if (urls.length === current.length && urls.every((url, index) => url === current[index])) {
      return
    }
    innerFileList.value = urls.map(url => ({ url, name: getFileName(url), status: 'success' }))
  },
  { immediate: true },
)

/** 上传前校验文件类型/扩展名（fileType 为空则不限制） */
const beforeUpload: UploadBeforeUpload = ({ files }) => {
  if (!props.fileType.length) {
    return true
  }
  const allowed = props.fileType.map(type => type.toLowerCase())
  for (const file of files) {
    const name = String(file.name || file.path || '')
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : ''
    const mime = String(file.type || '').toLowerCase()
    // 部分平台（如小程序）拿不到文件名/类型，无法判断时放行，避免误拒
    if (!mime && !ext) {
      continue
    }
    const matched = allowed.some((type) => {
      // 1) MIME 直接匹配（type 形如 image/png）
      if (mime && (mime === type || mime.includes(type))) {
        return true
      }
      // 2) 扩展名直接匹配（type 形如 png、doc，兼容带前导点 .png 与 jpg/jpeg 互通）
      if (ext) {
        const extType = type.replace(/^\./, '')
        if (extType === ext || (extType === 'jpg' && ext === 'jpeg') || (extType === 'jpeg' && ext === 'jpg')) {
          return true
        }
      }
      // 3) type 为 MIME 时，用其子类型匹配扩展名（image/png → png，并兼容 jpg/jpeg）
      if (ext && type.includes('/')) {
        const sub = type.slice(type.indexOf('/') + 1)
        return sub === ext || (sub === 'jpeg' && ext === 'jpg') || (sub === 'jpg' && ext === 'jpeg')
      }
      return false
    })
    if (!matched) {
      uni.showToast({ icon: 'none', title: `文件格式不正确，请上传 ${props.fileType.join('/')} 格式` })
      return false
    }
  }
  return true
}

/** 自定义上传方法：复用 uploadFileFromPath，按 VITE_UPLOAD_TYPE 分流（server 后端上传 / client S3 直传） */
const customUpload: UploadMethod = (file, formData, options) => {
  return uploadFileFromPath(file.url, props.directory || undefined, undefined, file.name)
    .then((url) => {
      // 拼成后端返回格式（{ code, data }），交给 wd-upload 内部解析
      options.onSuccess(
        { data: JSON.stringify({ code: 0, data: url }), statusCode: 200, errMsg: 'uploadFile:ok' } as UniApp.UploadFileSuccessCallbackResult,
        file,
        formData,
      )
    })
    .catch((error) => {
      const message = error?.message || '上传失败'
      uni.showToast({ icon: 'none', title: message })
      options.onError({ errMsg: message } as UniApp.GeneralCallbackResult, file, formData)
    })
}

/** 上传成功 / 删除时，同步访问地址数组 */
function handleChange({ fileList }: { fileList: UploadFileItem[] }) {
  emit('update:modelValue', successUrls(fileList))
}

/** 单个文件上传成功：抛出便捷的 url（uploaded）并透传原始事件（success） */
function handleSuccess(event: { file: UploadFileItem }) {
  const url = resolveUrl(event.file)
  if (url) {
    emit('uploaded', url, event.file.name)
  }
  emit('success', event)
}

/** 透传上传失败事件（供 form-create 等场景的钩子使用） */
function handleFail(event: any) {
  emit('fail', event)
}

/** 透传移除事件（供 form-create 等场景的钩子使用） */
function handleRemove(event: any) {
  emit('remove', event)
}

/** 文件超出大小限制 */
function handleOversize() {
  uni.showToast({ icon: 'none', title: `文件大小不能超过 ${props.fileSize}MB` })
}
</script>
