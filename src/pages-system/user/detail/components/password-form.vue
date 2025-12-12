<template>
  <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;" @close="handleClose">
    <view class="p-32rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">重置密码</text>
        <wd-icon name="close" size="20px" @click="handleClose" />
      </view>
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-input
          v-model="formData.password"
          label="新密码"
          label-width="160rpx"
          prop="password"
          show-password
          clearable
          placeholder="请输入新密码"
        />
        <wd-input
          v-model="formData.confirmPassword"
          label="确认密码"
          label-width="160rpx"
          prop="confirmPassword"
          show-password
          clearable
          placeholder="请再次输入新密码"
        />
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
import { computed, ref, watch } from 'vue'
import { useToast } from 'wot-design-uni'
import { resetUserPassword } from '@/api/system/user'

const props = defineProps<{
  modelValue: boolean
  userId: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const toast = useToast()
const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})
const loading = ref(false)
const formRef = ref()
const formData = ref({
  password: '',
  confirmPassword: '',
})
const formRules = {
  password: [{ required: true, message: '请输入新密码' }],
  confirmPassword: [
    { required: true, message: '请再次输入新密码' },
    {
      required: false,
      validator: (value: string) => value === formData.value.password,
      message: '两次输入的密码不一致',
    },
  ],
}

/** 监听弹窗打开，重置表单 */
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      formData.value = { password: '', confirmPassword: '' }
    }
  },
)

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
}

/** 确认提交 */
async function handleConfirm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  loading.value = true
  try {
    await resetUserPassword(props.userId, formData.value.password)
    toast.success('密码重置成功')
    handleClose()
    emit('success')
  } finally {
    loading.value = false
  }
}
</script>
