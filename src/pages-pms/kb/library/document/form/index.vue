<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="文档标题" title-width="220rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              placeholder="请输入文档标题"
              :maxlength="255"
            />
          </wd-form-item>
          <DocumentLabelFormPicker
            v-if="props.id"
            v-model="formData.labelIds"
            prop="labelIds"
          />
          <wd-form-item v-if="isFileDocument" title="文件" title-width="220rpx" prop="content">
            <yd-upload-file
              v-model="formData.content"
              :limit="1"
              :file-size="PmsKnowledgeUploadFileSize"
              @uploaded="handleFileUploaded"
            />
          </wd-form-item>
          <wd-form-item v-else title="文档内容" title-width="220rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              placeholder="请输入文档内容"
              :maxlength="50000"
              :auto-height="true"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view v-if="!isFileDocument" class="p-24rpx text-24rpx text-[#999]">
        移动端以纯文本编辑文档内容；富文本格式请在 PC 端编辑
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
import {
  createKnowledgeDocument,
  getKnowledgeDocument,
  updateKnowledgeDocument,
} from '@/api/pms/kb/content/document'
import {
  PmsKnowledgeDocumentType,
  PmsKnowledgeRootId,
  PmsKnowledgeUploadFileSize,
} from '@/pages-pms/kb/utils/constants'
import DocumentLabelFormPicker from '@/pages-pms/kb/label/components/document-label-form-picker.vue'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  libraryId?: number | any // 新建时由入口传入
  folderId?: number | any // 新建时由入口传入
  parentId?: number | any // 新建时由入口传入
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑文档' : '新建文档')
const formLoading = ref(false) // 表单提交状态
const formData = ref({ // 表单数据
  id: undefined as number | undefined,
  libraryId: Number(props.libraryId) || 0,
  folderId: Number(props.folderId) || PmsKnowledgeRootId,
  parentId: Number(props.parentId) || PmsKnowledgeRootId,
  title: '',
  type: PmsKnowledgeDocumentType.RICH_TEXT as number,
  content: '',
  labelIds: [] as number[],
  fileType: undefined as string | undefined,
  fileSize: undefined as number | undefined,
})
const isFileDocument = computed(() => formData.value.type === PmsKnowledgeDocumentType.FILE) // 是否文件类型文档
const formSchema = computed(() => createFormSchema({
  title: [{ required: true, message: '请输入文档标题' }],
  // 富文本文档正文必填，文件文档以文件为内容
  content: [{ required: () => !isFileDocument.value, message: '请输入文档内容' }],
}))
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const document = await getKnowledgeDocument(Number(props.id))
  formData.value = {
    ...formData.value,
    id: document.id,
    libraryId: document.libraryId,
    folderId: document.folderId,
    parentId: document.parentId,
    title: document.title,
    type: document.type,
    content: document.content || '',
    labelIds: document.labelIds ?? [],
    fileType: document.fileType,
    fileSize: document.fileSize,
  }
}

/** 文件替换后同步扩展名和大小元数据 */
function handleFileUploaded(value: string, _name?: string, size?: number) {
  if (!value) {
    return
  }
  const fileName = decodeURIComponent(value.split('?')[0].split('/').pop() || '')
  formData.value.fileType = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : undefined
  formData.value.fileSize = size
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateKnowledgeDocument({
        id: formData.value.id!,
        title: formData.value.title,
        content: formData.value.content,
        labelIds: formData.value.labelIds,
        fileType: formData.value.fileType,
        fileSize: formData.value.fileSize,
      })
      toast.success('更新成功')
      uni.$emit('pms:kb:document:reload')
      uni.$emit('pms:kb:content:reload')
      navigateBackPlus()
      return
    }
    const id = await createKnowledgeDocument({
      libraryId: formData.value.libraryId,
      folderId: formData.value.folderId,
      parentId: formData.value.parentId,
      title: formData.value.title,
      type: formData.value.type,
      content: formData.value.content || undefined,
    })
    toast.success('创建成功')
    uni.$emit('pms:kb:content:reload')
    // 创建成功后直接进入编辑页继续编写内容
    uni.redirectTo({ url: `/pages-pms/kb/library/document/form/index?id=${id}` })
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
