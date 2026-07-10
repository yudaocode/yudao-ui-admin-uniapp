<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <KnowledgeFormPicker v-model="formData.knowledgeId" label-width="230rpx" prop="knowledgeId" />
          <wd-form-item title="文档名称" title-width="230rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入文档名称" />
          </wd-form-item>
          <wd-form-item v-if="!props.id" title="文档 URL" title-width="230rpx" prop="url">
            <wd-input v-model="formData.url" clearable placeholder="请输入已上传文档 URL" />
          </wd-form-item>
          <wd-form-item title="分片 Token" title-width="230rpx" prop="segmentMaxTokens">
            <wd-input-number v-model="formData.segmentMaxTokens" :min="1" :max="2048" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="230rpx" prop="status" center>
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
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { KnowledgeDocumentVO } from '@/api/ai/knowledge/document'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createKnowledgeDocument,
  getKnowledgeDocument,
  updateKnowledgeDocument,
} from '@/api/ai/knowledge/document'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import KnowledgeFormPicker from '../../components/knowledge-form-picker.vue'

const props = defineProps<{
  id?: number | any
  knowledgeId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑文档' : '新增文档')
const formLoading = ref(false) // 表单提交状态
const formData = ref<KnowledgeDocumentVO & { url?: string }>({
  knowledgeId: props.knowledgeId ? Number(props.knowledgeId) : undefined,
  name: '',
  url: '',
  segmentMaxTokens: 500,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  knowledgeId: [{ required: true, message: '知识库不能为空' }],
  name: [{ required: true, message: '文档名称不能为空' }],
  url: [{ required: () => !props.id, message: '文档 URL 不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/knowledge/document/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getKnowledgeDocument(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (props.id) {
      await updateKnowledgeDocument(data)
      toast.success('修改成功')
    } else {
      await createKnowledgeDocument(data)
      toast.success('新增成功')
    }
    uni.$emit('ai:knowledge-document:reload')
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
