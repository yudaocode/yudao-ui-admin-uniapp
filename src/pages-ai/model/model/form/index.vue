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
          <yd-form-picker
            v-model="formData.platform"
            label="平台"
            label-width="200rpx"
            prop="platform"
            :dict-type="DICT_TYPE.AI_PLATFORM"
            dict-kind="str"
            placeholder="请选择平台"
          />
          <yd-form-picker
            v-model="formData.type"
            label="模型类型"
            label-width="200rpx"
            prop="type"
            :dict-type="DICT_TYPE.AI_MODEL_TYPE"
            placeholder="请选择模型类型"
            :disabled="!!props.id"
          />
          <ApiKeyFormPicker v-model="formData.keyId" prop="keyId" />
          <wd-form-item title="模型名字" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入模型名字" />
          </wd-form-item>
          <wd-form-item title="模型标识" title-width="200rpx" prop="model">
            <wd-input v-model="formData.model" clearable placeholder="请输入模型标识" />
          </wd-form-item>
          <wd-form-item title="排序" title-width="200rpx" prop="sort">
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <!-- 聊天模型专属参数 -->
          <template v-if="formData.type === AiModelTypeEnum.CHAT">
            <wd-form-item title="温度" title-width="200rpx" prop="temperature">
              <wd-input-number v-model="formData.temperature" :min="0" :max="2" :step="0.1" />
            </wd-form-item>
            <wd-form-item title="Token 数" title-width="200rpx" prop="maxTokens">
              <wd-input-number v-model="formData.maxTokens" :min="0" :max="8192" />
            </wd-form-item>
            <wd-form-item title="上下文" title-width="200rpx" prop="maxContexts">
              <wd-input-number v-model="formData.maxContexts" :min="0" :max="20" />
            </wd-form-item>
          </template>
          <wd-form-item title="状态" title-width="200rpx" prop="status" center>
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
import type { AiModel } from '@/api/ai/model/model'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createModel, getModel, updateModel } from '@/api/ai/model/model'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { AiModelTypeEnum, CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ApiKeyFormPicker from '../../apiKey/components/api-key-form-picker.vue'

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
const getTitle = computed(() => props.id ? '编辑模型' : '新增模型')
const formLoading = ref(false) // 表单提交状态
const formData = ref<AiModel>({
  keyId: undefined,
  name: '',
  model: '',
  platform: '',
  type: AiModelTypeEnum.CHAT,
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  temperature: 0.7,
  maxTokens: 4096,
  maxContexts: 10,
}) // 表单数据
const formSchema = createFormSchema({
  platform: [{ required: true, message: '平台不能为空' }],
  type: [{ required: true, message: '模型类型不能为空' }],
  keyId: [{ required: true, message: 'API 密钥不能为空' }],
  name: [{ required: true, message: '模型名字不能为空' }],
  model: [{ required: true, message: '模型标识不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
  temperature: [{ required: () => formData.value.type === AiModelTypeEnum.CHAT, message: '温度参数不能为空' }],
  maxTokens: [{ required: () => formData.value.type === AiModelTypeEnum.CHAT, message: 'Token 数不能为空' }],
  maxContexts: [{ required: () => formData.value.type === AiModelTypeEnum.CHAT, message: '上下文数量不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/model/model/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getModel(Number(props.id))
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
    // 非聊天模型不提交聊天专属参数
    if (data.type !== AiModelTypeEnum.CHAT) {
      delete data.temperature
      delete data.maxTokens
      delete data.maxContexts
    }
    if (props.id) {
      await updateModel(data)
      toast.success('修改成功')
    } else {
      await createModel(data)
      toast.success('新增成功')
    }
    uni.$emit('ai:model:reload')
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
