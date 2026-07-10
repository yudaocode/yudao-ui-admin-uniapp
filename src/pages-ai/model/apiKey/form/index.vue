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
          <wd-form-item title="名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入名称" />
          </wd-form-item>
          <wd-form-item title="密钥" title-width="200rpx" prop="apiKey">
            <wd-input v-model="formData.apiKey" clearable placeholder="请输入密钥" />
          </wd-form-item>
          <wd-form-item title="API URL" title-width="200rpx">
            <wd-input v-model="formData.url" clearable placeholder="请输入自定义 API URL" />
          </wd-form-item>
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
import type { ApiKeyVO } from '@/api/ai/model/apiKey'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createApiKey, getApiKey, updateApiKey } from '@/api/ai/model/apiKey'
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
const getTitle = computed(() => props.id ? '编辑 API 密钥' : '新增 API 密钥')
const formLoading = ref(false) // 表单提交状态
const formData = ref<ApiKeyVO>({
  id: undefined,
  name: '',
  apiKey: '',
  platform: '',
  url: '',
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  platform: [{ required: true, message: '平台不能为空' }],
  name: [{ required: true, message: '名称不能为空' }],
  apiKey: [{ required: true, message: '密钥不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/model/apiKey/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getApiKey(Number(props.id))
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
      await updateApiKey(data)
      toast.success('修改成功')
    } else {
      await createApiKey(data)
      toast.success('新增成功')
    }
    uni.$emit('ai:api-key:reload')
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
