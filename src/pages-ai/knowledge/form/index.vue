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
          <wd-form-item title="名称" title-width="230rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入知识库名称" />
          </wd-form-item>
          <wd-form-item title="描述" title-width="230rpx">
            <wd-textarea v-model="formData.description" placeholder="请输入知识库描述" clearable />
          </wd-form-item>
          <ModelFormPicker v-model="formData.embeddingModelId" label="嵌入模型" label-width="230rpx" prop="embeddingModelId" placeholder="请选择嵌入模型" :model-type="AiModelTypeEnum.EMBEDDING" />
          <wd-form-item title="TopK" title-width="230rpx" prop="topK">
            <wd-input-number v-model="formData.topK" :min="0" :max="10" />
          </wd-form-item>
          <wd-form-item title="相似度阈值" title-width="230rpx" prop="similarityThreshold">
            <wd-input-number v-model="formData.similarityThreshold" :min="0" :max="1" :step="0.01" />
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
import type { Knowledge } from '@/api/ai/knowledge/knowledge'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createKnowledge, getKnowledge, updateKnowledge } from '@/api/ai/knowledge/knowledge'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { AiModelTypeEnum, CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ModelFormPicker from '@/pages-ai/model/model/components/model-form-picker.vue'

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
const getTitle = computed(() => props.id ? '编辑知识库' : '新增知识库')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Knowledge>({
  id: undefined,
  name: '',
  description: '',
  embeddingModelId: undefined,
  topK: 5,
  similarityThreshold: 0.5,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '知识库名称不能为空' }],
  embeddingModelId: [{ required: true, message: '嵌入模型不能为空' }],
  topK: [{ required: true, message: '检索 TopK 不能为空' }],
  similarityThreshold: [{ required: true, message: '相似度阈值不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/knowledge/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getKnowledge(Number(props.id))
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
      await updateKnowledge(formData.value)
      toast.success('修改成功')
    } else {
      await createKnowledge(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('ai:knowledge:reload')
    uni.$emit('ai:knowledge:detail-reload')
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
