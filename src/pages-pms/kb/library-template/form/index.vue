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
          <wd-form-item title="模板名称" title-width="220rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入模板名称"
              :maxlength="100"
            />
          </wd-form-item>
          <wd-form-item title="模板状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="显示顺序" title-width="220rpx" prop="sort">
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="模板封面" title-width="220rpx" prop="coverUrl">
            <yd-upload-img v-model="formData.coverUrl" :limit="1" />
          </wd-form-item>
          <wd-form-item title="模板简介" title-width="220rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              placeholder="请输入模板适用场景"
              :maxlength="500"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 模板文档 -->
      <view class="mt-24rpx bg-white p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">模板文档（{{ formData.documents.length }}）</text>
          <wd-button size="small" type="primary" variant="plain" @click="handleAddDocument">
            新增文档
          </wd-button>
        </view>
        <view
          v-for="(doc, index) in formData.documents"
          :key="index"
          class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-20rpx"
        >
          <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ index + 1 }}. {{ doc.title }}</text>
          <view class="flex shrink-0 gap-16rpx">
            <text class="text-26rpx text-[#1677ff]" @click="handleEditDocument(index)">编辑</text>
            <text class="text-26rpx text-[#f5222d]" @click="handleRemoveDocument(index)">删除</text>
          </view>
        </view>
        <wd-empty v-if="!formData.documents.length" description="请至少添加一篇模板文档" />
      </view>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>

    <!-- 模板文档编辑弹窗 -->
    <wd-popup v-model="documentVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          编辑模板文档
        </view>
        <wd-cell-group border>
          <wd-cell title="文档标题" title-width="200rpx">
            <wd-input v-model.trim="documentForm.title" placeholder="请输入文档标题" :maxlength="255" />
          </wd-cell>
        </wd-cell-group>
        <view class="mt-24rpx">
          <view class="mb-12rpx text-28rpx text-[#666]">
            文档内容
          </view>
          <wd-textarea
            v-model="documentForm.content"
            placeholder="请输入文档内容"
            :maxlength="50000"
            :auto-height="true"
          />
        </view>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" @click="documentVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleConfirmDocument">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type {
  KnowledgeLibraryTemplateDocument,
  KnowledgeLibraryTemplateSaveReq,
} from '@/api/pms/kb/library/template'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createKnowledgeLibraryTemplate,
  getKnowledgeLibraryTemplate,
  updateKnowledgeLibraryTemplate,
} from '@/api/pms/kb/library/template'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const getTitle = computed(() => props.id ? '修改知识库模板' : '新增知识库模板')
const formLoading = ref(false) // 表单提交状态
const documentVisible = ref(false) // 文档编辑弹窗显示状态
const editingDocumentIndex = ref(-1) // 当前编辑文档下标
const documentForm = ref<KnowledgeLibraryTemplateDocument>({ title: '', content: '' }) // 文档编辑表单
const formData = ref<KnowledgeLibraryTemplateSaveReq>({ // 表单数据
  id: undefined,
  name: '',
  description: '',
  coverUrl: undefined,
  status: CommonStatusEnum.ENABLE,
  sort: 0,
  documents: [],
})
const formSchema = createFormSchema({
  name: [{ required: true, message: '请输入模板名称' }],
  status: [{ required: true, message: '请选择模板状态' }],
  sort: [{ required: true, message: '请输入显示顺序' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pms/kb/library-template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getKnowledgeLibraryTemplate(Number(props.id))
}

/** 新增模板文档 */
function handleAddDocument() {
  editingDocumentIndex.value = -1
  documentForm.value = { title: '', content: '' }
  documentVisible.value = true
}

/** 编辑模板文档 */
function handleEditDocument(index: number) {
  editingDocumentIndex.value = index
  documentForm.value = { ...formData.value.documents[index] }
  documentVisible.value = true
}

/** 确认模板文档 */
function handleConfirmDocument() {
  if (!documentForm.value.title.trim()) {
    toast.warning('请输入文档标题')
    return
  }
  if (!documentForm.value.content.trim()) {
    toast.warning('请输入文档内容')
    return
  }
  const document = { ...documentForm.value }
  if (editingDocumentIndex.value < 0) {
    formData.value.documents.push(document)
  } else {
    formData.value.documents[editingDocumentIndex.value] = document
  }
  documentVisible.value = false
}

/** 删除模板文档 */
async function handleRemoveDocument(index: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定删除该模板文档吗？' })
  } catch {
    return
  }
  formData.value.documents.splice(index, 1)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!formData.value.documents.length) {
    toast.warning('请至少添加一篇模板文档')
    return
  }
  const documentTitles = formData.value.documents.map(item => item.title)
  if (new Set(documentTitles).size !== documentTitles.length) {
    toast.warning('模板文档标题不能重复')
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateKnowledgeLibraryTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createKnowledgeLibraryTemplate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('pms:kb:library-template:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
