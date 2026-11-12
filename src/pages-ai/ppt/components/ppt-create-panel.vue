<template>
  <view class="p-24rpx">
    <view class="mb-20rpx">
      <view class="text-32rpx text-[#333] font-semibold">
        创建 PPT
      </view>
      <view class="mt-6rpx text-24rpx text-[#999]">
        粘贴你的大纲，或上传材料一键生成分镜和配图
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <!-- 格式 -->
          <wd-form-item title="格式" title-width="170rpx" prop="mode" layout="vertical">
            <view class="grid grid-cols-2 w-full gap-16rpx">
              <view
                v-for="item in modeOptions"
                :key="item.value"
                class="border-2rpx rounded-12rpx border-solid p-20rpx"
                :class="formData.mode === item.value ? 'border-[#1677ff] bg-[#eef4ff]' : 'border-[#e5e5e5]'"
                @click="formData.mode = item.value"
              >
                <view class="text-28rpx text-[#333] font-semibold">
                  {{ item.label }}
                </view>
                <view class="mt-6rpx text-22rpx text-[#999] leading-34rpx">
                  {{ item.description }}
                </view>
              </view>
            </view>
          </wd-form-item>
          <!-- 语言 -->
          <wd-form-item title="选择语言" title-width="170rpx" prop="language" center>
            <wd-radio-group v-model="formData.language" type="button">
              <wd-radio :value="AiPptLanguageEnum.ZH_CN">
                中文
              </wd-radio>
              <wd-radio :value="AiPptLanguageEnum.EN">
                English
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <!-- 时长：只是页数的快捷设置，不提交后端 -->
          <wd-form-item title="时长" title-width="170rpx" center>
            <wd-radio-group :model-value="duration" type="button" @change="handleDurationChange">
              <wd-radio value="short">
                短
              </wd-radio>
              <wd-radio value="default">
                默认
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="PPT 页数" title-width="170rpx" prop="pageCount" center>
            <wd-input-number v-model="formData.pageCount" :min="3" :max="30" :precision="0" />
          </wd-form-item>
          <!-- 绘图模型：只列出支持整页文生图的平台 -->
          <PptImageModelFormPicker v-model="formData.imageModelId" prop="imageModelId" />
          <!-- 素材：粘贴大纲、上传材料二选一 -->
          <wd-form-item title="素材来源" title-width="170rpx" prop="source" center>
            <wd-radio-group v-model="formData.source" type="button">
              <wd-radio :value="AiPptSourceEnum.PASTE">
                粘贴大纲
              </wd-radio>
              <wd-radio :value="AiPptSourceEnum.UPLOAD">
                上传材料
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item
            v-if="formData.source === AiPptSourceEnum.PASTE"
            title="把你的大纲或者内容粘贴在这里"
            prop="content"
            layout="vertical"
          >
            <wd-textarea
              v-model="formData.content"
              :maxlength="contentMaxLength"
              show-word-limit
              clearable
              placeholder="添加一份概略提纲，或指定受众、风格和重点，例如：为新手用户创建一套演示文稿，采用大胆活泼的风格，注重分步说明。"
            />
          </wd-form-item>
          <wd-form-item
            v-else
            title="上传 PPT 材料（支持 PDF/Word/TXT/Markdown 格式）"
            prop="fileUrl"
            layout="vertical"
          >
            <view v-if="uploadFile" class="w-full flex items-center gap-12rpx rounded-12rpx bg-[#f8f8f8] px-20rpx py-16rpx">
              <wd-icon name="file" size="36rpx" color="#1677ff" />
              <text class="min-w-0 flex-1 truncate text-26rpx text-[#333]">{{ uploadFile.name }}</text>
              <text class="shrink-0 text-22rpx text-[#999]">
                {{ uploadFile.uploading ? '上传中...' : formatFileSize(uploadFile.size) }}
              </text>
              <text class="shrink-0 text-24rpx text-[#f5222d]" @click="handleFileRemove">移除</text>
            </view>
            <template v-else>
              <!-- 选择材料：App 端暂不支持选择本地文件 -->
              <!-- #ifdef H5 || MP-WEIXIN -->
              <wd-button block variant="plain" @click="handleChooseFile">
                选择文件
              </wd-button>
              <view class="mt-12rpx text-22rpx text-[#999]">
                {{ AI_PPT_FILE_TYPES.join(' / ') }}，≤ {{ fileMaxSizeMb }} MB
              </view>
              <!-- #endif -->
              <!-- #ifdef APP-PLUS -->
              <view class="text-24rpx text-[#999]">
                App 端暂不支持选择本地文件，请改用粘贴大纲
              </view>
              <!-- #endif -->
            </template>
          </wd-form-item>
          <!-- 风格与设计要求 -->
          <wd-form-item title="风格与设计要求（可选）" prop="prompt" layout="vertical">
            <wd-textarea
              v-model="formData.prompt"
              :maxlength="1024"
              show-word-limit
              clearable
              placeholder="例如：极简商务风、卡通手绘风"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 提交按钮 -->
    <view class="mt-24rpx">
      <wd-button block type="primary" :loading="submitting" @click="handleSubmit">
        {{ submitting ? '任务创建中...' : '生成' }}
      </wd-button>
    </view>

    <!-- 小提示 -->
    <view class="mt-24rpx text-22rpx text-[#999] leading-36rpx">
      <view>小提示：</view>
      <view>· 建议使用分层级的大纲（如 Markdown 标题）让分镜更加清晰</view>
      <view>· 页数会在生成分镜时作为约束，保证故事线完整</view>
      <view>· 每页是一张整页图，标题和要点由绘图模型画在图里；导出的 PPTX、PDF 每页也是一张图</view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { generatePpt } from '@/api/ai/ppt'
import { AI_PPT_FILE_TYPES, AiPptLanguageEnum, AiPptModeEnum, AiPptSourceEnum } from '@/utils/constants'
import { formatFileSize } from '@/utils/download'
import { uploadFileFromPath } from '@/utils/uploadFile'
import { createFormSchema } from '@/utils/wot'
import PptImageModelFormPicker from './ppt-image-model-form-picker.vue'

const emit = defineEmits<{
  submitted: [] // 提交成功，用于刷新列表
}>()

const toast = useToast()
const modeOptions = [ // 格式选项
  {
    label: '详细演示文稿',
    value: AiPptModeEnum.DETAILED,
    description: '一整套包含全文和详情的演示文稿，适合邮件发送或单独阅读。',
  },
  {
    label: '演示用幻灯片',
    value: AiPptModeEnum.SLIDES,
    description: '简洁直观的幻灯片，附带要点，为演讲提供支持。',
  },
]
const durationPageCounts = { short: 6, default: 10 } // 时长对应的页数
const contentMaxLength = 25000 // 大纲最大长度，与后端一致
const fileMaxSizeMb = 10 // 材料最大大小（MB）
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref({
  mode: AiPptModeEnum.DETAILED as number,
  language: AiPptLanguageEnum.ZH_CN as string,
  pageCount: durationPageCounts.default,
  imageModelId: undefined as number | undefined,
  source: AiPptSourceEnum.PASTE as number,
  content: '',
  fileUrl: '',
  prompt: '',
}) // 表单数据
const uploadFile = ref<{ name: string, size: number, uploading: boolean }>() // 已选的材料
const submitting = ref(false) // 提交状态
const duration = computed(() => { // 页数对应的时长；不是 6 / 10 页时不选中
  const keys = Object.keys(durationPageCounts) as Array<keyof typeof durationPageCounts>
  return keys.find(key => durationPageCounts[key] === formData.value.pageCount)
})
const formSchema = createFormSchema({
  mode: [{ required: true, message: '请选择格式' }],
  language: [{ required: true, message: '请选择语言' }],
  pageCount: [
    { required: true, message: '请输入页数' },
    { min: 3, max: 30, message: '页数需在 3～30 页之间' },
  ],
  imageModelId: [{ required: true, message: '请选择绘图模型' }],
  content: [{ required: () => formData.value.source === AiPptSourceEnum.PASTE, message: '请输入大纲内容' }],
  fileUrl: [{ required: () => formData.value.source === AiPptSourceEnum.UPLOAD, message: '请上传材料文件' }],
})

/** 时长：只是把页数设为 6 / 10 */
function handleDurationChange({ value }: { value: unknown }) {
  formData.value.pageCount = durationPageCounts[value as keyof typeof durationPageCounts]
}

/** 选择材料：H5 使用 chooseFile，微信小程序使用 chooseMessageFile */
function handleChooseFile() {
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: AI_PPT_FILE_TYPES,
    success: (res) => {
      const file = res.tempFiles[0]
      handleUpload(file.path, file.name, file.size)
    },
  })
  // #endif
  // #ifdef H5
  uni.chooseFile({
    count: 1,
    extension: AI_PPT_FILE_TYPES.map(type => `.${type}`),
    success: (res) => {
      const file = (res.tempFiles as any[])[0]
      handleUpload(file.path, file.name, file.size)
    },
  })
  // #endif
}

/** 上传材料：校验后立即上传到文件服务，成功后记录 fileUrl */
async function handleUpload(filePath: string, name: string, size: number) {
  const extension = name.split('.').pop()?.toLowerCase() || ''
  if (!AI_PPT_FILE_TYPES.includes(extension)) {
    toast.error(`仅支持 ${AI_PPT_FILE_TYPES.join(' / ')} 格式的文件`)
    return
  }
  if (size > fileMaxSizeMb * 1024 * 1024) {
    toast.error(`材料文件不能超过 ${fileMaxSizeMb} MB`)
    return
  }
  uploadFile.value = { name, size, uploading: true }
  const file = uploadFile.value // 响应式代理：用于判断上传期间是否已移除或重新选择
  formData.value.fileUrl = ''
  try {
    const fileUrl = await uploadFileFromPath(filePath, 'ai/ppt', undefined, name)
    if (uploadFile.value !== file) {
      return // 上传期间已移除或重新选择
    }
    file.uploading = false
    formData.value.fileUrl = fileUrl
    formRef.value?.validate('fileUrl') // 清除「请上传材料文件」的校验提示
  } catch {
    // 文件上传不经过统一请求层，需要页面提示失败
    if (uploadFile.value === file) {
      uploadFile.value = undefined
      toast.error('材料上传失败，请重新上传')
    }
  }
}

/** 移除材料 */
function handleFileRemove() {
  uploadFile.value = undefined
  formData.value.fileUrl = ''
}

/** 提交生成：上传材料时，文件已先上传到文件服务，只提交地址 */
async function handleSubmit() {
  if (formData.value.source === AiPptSourceEnum.UPLOAD && uploadFile.value?.uploading) {
    toast.warning('材料上传中，请稍候')
    return
  }
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  submitting.value = true
  try {
    const data = formData.value
    const isPaste = data.source === AiPptSourceEnum.PASTE
    await generatePpt({
      ...data,
      imageModelId: data.imageModelId!,
      content: isPaste ? data.content : undefined, // 只提交当前来源的素材
      fileUrl: isPaste ? undefined : data.fileUrl,
    })
    toast.success('任务已提交，正在生成分镜')
    emit('submitted')
  } finally {
    submitting.value = false
  }
}
</script>
