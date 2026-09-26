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
          <wd-form-item title="渠道编码" title-width="220rpx">
            <wd-input v-model="formData.code" disabled />
          </wd-form-item>
          <wd-form-item title="渠道费率(%)" title-width="220rpx" prop="feeRate" center>
            <wd-input-number v-model="formData.feeRate" :min="0" :step="0.01" :precision="2" />
          </wd-form-item>
          <wd-form-item title="渠道状态" title-width="220rpx" prop="status" center>
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
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              auto-height
              clearable
              placeholder="请输入备注"
            />
          </wd-form-item>
          <!-- 渠道配置 -->
          <AlipayConfig v-if="isAlipayChannel" ref="alipayConfigRef" :config="formData.config" />
          <WeixinConfig v-if="isWeixinChannel" ref="weixinConfigRef" :config="formData.config" />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        v-if="hasAccessByCodes([formData.id ? 'pay:channel:update' : 'pay:channel:create'])"
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
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPayChannel,
  getPayChannel,
  updatePayChannel,
} from '@/api/pay/channel'
import { useAccess } from '@/hooks/useAccess'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, PayChannelEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import AlipayConfig from '../components/alipay-config.vue'
import WeixinConfig from '../components/weixin-config.vue'

const props = defineProps<{
  appId?: number | any
  code?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const alipayConfigRef = ref<any>() // 支付宝配置子组件引用
const weixinConfigRef = ref<any>() // 微信配置子组件引用
const formLoading = ref(false) // 表单提交状态
const formData = ref({
  id: undefined as number | undefined,
  appId: undefined as number | undefined,
  code: '',
  status: CommonStatusEnum.ENABLE,
  feeRate: 0,
  remark: '',
  config: {} as Record<string, any>,
}) // 表单数据
const getTitle = computed(() => formData.value.id ? '编辑支付渠道' : '新增支付渠道')
const formSchema = createFormSchema({
  feeRate: [{ required: true, message: '渠道费率不能为空' }],
  status: [{ required: true, message: '渠道状态不能为空' }],
})

const isAlipayChannel = computed(() => {
  const code = props.code || ''
  return code.startsWith('alipay_')
})
const isWeixinChannel = computed(() => {
  const code = props.code || ''
  return code.startsWith('wx_')
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-pay/app/channel/index?appId=${props.appId || ''}`)
}

/** 默认渠道配置 */
function getDefaultConfig(code?: string) {
  if (code === PayChannelEnum.WALLET.code) {
    return { name: 'wallet-conf' }
  }
  if (code === PayChannelEnum.MOCK.code) {
    return { name: 'mock-conf' }
  }
  return {}
}

/** 解析渠道配置为对象（兼容后端返回字符串或对象） */
function parseConfig(config: any): Record<string, any> {
  if (!config) {
    return {}
  }
  if (typeof config === 'string') {
    try {
      return JSON.parse(config)
    } catch {
      return {}
    }
  }
  return { ...config }
}

/** 校验渠道配置：委托当前渠道子组件的字段校验 */
function validateConfig() {
  const error = isAlipayChannel.value
    ? alipayConfigRef.value?.validate?.()
    : isWeixinChannel.value
      ? weixinConfigRef.value?.validate?.()
      : ''
  if (error) {
    toast.show(error)
    return false
  }
  return true
}

/** 加载详情 */
async function getDetail() {
  if (!props.appId || !props.code) {
    return
  }
  formData.value = {
    id: undefined,
    appId: Number(props.appId),
    code: props.code,
    status: CommonStatusEnum.ENABLE,
    feeRate: 0,
    remark: '',
    config: getDefaultConfig(props.code),
  }
  formLoading.value = true
  try {
    const data = await getPayChannel(Number(props.appId), props.code)
    if (!data?.id) {
      return
    }
    formData.value = {
      id: data.id,
      appId: data.appId,
      code: data.code || props.code,
      status: data.status ?? CommonStatusEnum.ENABLE,
      feeRate: data.feeRate ?? 0,
      remark: data.remark || '',
      config: { ...getDefaultConfig(props.code), ...parseConfig(data.config) },
    }
  } finally {
    formLoading.value = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!validateConfig()) {
    return
  }

  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      appId: Number(props.appId),
      code: props.code,
      config: JSON.stringify(formData.value.config),
    }
    if (formData.value.id) {
      await updatePayChannel(data)
      toast.success('修改成功')
    } else {
      await createPayChannel(data)
      toast.success('新增成功')
    }
    uni.$emit('pay-channel:reload')
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
