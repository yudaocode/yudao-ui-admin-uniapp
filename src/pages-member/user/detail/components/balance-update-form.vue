<template>
  <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;" @close="handleClose">
    <view class="p-32rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">修改用户余额</text>
        <wd-icon name="close" size="20px" @click="handleClose" />
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-form-item title="用户编号" title-width="210rpx" prop="id">
          <wd-input v-model="formData.id" disabled />
        </wd-form-item>
        <wd-form-item title="用户昵称" title-width="210rpx" prop="nickname">
          <wd-input v-model="formData.nickname" disabled />
        </wd-form-item>
        <wd-form-item title="变动前余额" title-width="210rpx">
          <text>{{ formatAmount(formData.balance) }}</text>
        </wd-form-item>
        <wd-form-item title="变动类型" title-width="210rpx" prop="changeType" center>
          <wd-radio-group v-model="formData.changeType" type="button">
            <wd-radio :value="1">
              增加
            </wd-radio>
            <wd-radio :value="-1">
              减少
            </wd-radio>
          </wd-radio-group>
        </wd-form-item>
        <wd-form-item title="变动余额" title-width="210rpx" prop="changeBalance">
          <wd-input-number v-model="formData.changeBalance" :min="0" :step="0.01" :precision="2" />
        </wd-form-item>
        <wd-form-item title="变动后余额" title-width="210rpx">
          <text>{{ formatAmount(balanceResult) }}</text>
        </wd-form-item>
      </wd-form>
      <view class="mt-32rpx">
        <wd-button type="primary" block :loading="loading" @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getMemberUser } from '@/api/member/user'
import { getPayWallet, updatePayWalletBalance } from '@/api/pay/wallet/balance'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  modelValue: boolean
  userId?: number | any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const toast = useToast()
const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
}) // 弹窗显示状态
const loading = ref(false) // 表单提交状态
const formData = ref({
  id: undefined as number | undefined,
  nickname: undefined as string | undefined,
  balance: 0,
  changeBalance: 0,
  changeType: 1,
}) // 表单数据
const balanceResult = computed(() => {
  return formData.value.balance + yuanToFen(formData.value.changeBalance) * formData.value.changeType
}) // 变动后余额
const formSchema = createFormSchema({
  changeBalance: [
    { required: true, message: '变动余额不能为空' },
    { validator: value => Number(value) > 0 || '变动余额不能为零' },
    { validator: () => balanceResult.value >= 0 || '变动后的余额不能小于 0' },
  ],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 金额元转分 */
function yuanToFen(value?: number | string) {
  return Math.round(Number(value || 0) * 100)
}

/** 金额分转元展示 */
function formatAmount(value?: number | string) {
  return `￥${(Number(value || 0) / 100).toFixed(2)}`
}

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
}

/** 加载会员钱包 */
async function loadUser() {
  if (!props.userId) {
    return
  }
  loading.value = true
  try {
    const user = await getMemberUser(Number(props.userId))
    const wallet = await getPayWallet({ userId: user.id || 0 })
    formData.value = {
      id: user.id,
      nickname: user.nickname,
      balance: wallet?.balance || 0,
      changeBalance: 0,
      changeType: 1,
    }
  } finally {
    loading.value = false
  }
}

/** 提交表单 */
async function handleConfirm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  loading.value = true
  try {
    await updatePayWalletBalance({
      userId: formData.value.id,
      balance: yuanToFen(formData.value.changeBalance) * formData.value.changeType,
    })
    toast.success('修改成功')
    handleClose()
    emit('success')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      loadUser()
    }
  },
)
</script>
