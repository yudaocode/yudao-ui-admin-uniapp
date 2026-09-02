<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="上传文件"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="文件" title-width="220rpx" prop="content">
            <yd-upload-file
              v-model="formData.content"
              :limit="1"
              :file-size="PmsKnowledgeUploadFileSize"
              :file-type="[...PmsKnowledgeUploadFileTypes]"
              @uploaded="handleFileUploaded"
            />
          </wd-form-item>
          <wd-form-item title="文件名称" title-width="220rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              placeholder="上传后自动填充，可修改"
              :maxlength="255"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="p-24rpx text-24rpx text-[#999]">
        支持格式：{{ PmsKnowledgeUploadFileTypes.join('/') }}，大小不超过 {{ PmsKnowledgeUploadFileSize }}MB
      </view>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createKnowledgeDocument } from '@/api/pms/kb/content/document'
import {
  PmsKnowledgeDocumentType,
  PmsKnowledgeRootId,
  PmsKnowledgeUploadFileSize,
  PmsKnowledgeUploadFileTypes,
} from '@/pages-pms/kb/utils/constants'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  libraryId?: number | any
  folderId?: number | any
  parentId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const formData = ref({ // 表单数据
  libraryId: Number(props.libraryId) || 0,
  folderId: Number(props.folderId) || PmsKnowledgeRootId,
  parentId: Number(props.parentId) || PmsKnowledgeRootId,
  title: '',
  type: PmsKnowledgeDocumentType.FILE as number,
  content: '',
  fileType: undefined as string | undefined,
  fileSize: undefined as number | undefined,
})
const formSchema = createFormSchema({
  content: [{ required: true, message: '请上传文件' }],
  title: [{ required: true, message: '请输入文件名称' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 文件上传完成后，用文件地址填充名称、扩展名和大小 */
function handleFileUploaded(value: string, name?: string, size?: number) {
  if (!value) {
    return
  }
  const fileName = decodeURIComponent(name || value.split('?')[0].split('/').pop() || '')
  formData.value.fileType = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : undefined
  formData.value.fileSize = size
  if (!formData.value.title) {
    formData.value.title = fileName.replace(/\.[^.]+$/, '') || fileName
  }
}

/** 提交文件类型文档 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    await createKnowledgeDocument(formData.value)
    toast.success('上传成功')
    uni.$emit('pms:kb:content:reload')
    navigateBackPlus()
  } finally {
    formLoading.value = false
  }
}
</script>
