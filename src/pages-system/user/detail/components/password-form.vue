<template>
  <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;" @close="handleClose">
    <view class="p-32rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">重置密码</text>
        <wd-icon name="close" size="20px" @click="handleClose" />
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-form-item title="新密码" title-width="160rpx" prop="password">
          <wd-input
            v-model="formData.password"
            show-password
            clearable
            placeholder="请输入新密码"
          />
        </wd-form-item>
        <wd-form-item title="确认密码" title-width="160rpx" prop="confirmPassword">
          <wd-input
            v-model="formData.confirmPassword"
            show-password
            clearable
            placeholder="请再次输入新密码"
          />
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
import { resetUserPassword } from '@/api/system/user'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  modelValue: boolean
  userId: number | any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const toast = useToast()
const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
}) // 修改密码弹窗显示状态
const loading = ref(false) // 表单提交状态
const formData = ref({
  password: '',
  confirmPassword: '',
}) // 表单数据
const formSchema = createFormSchema({
  password: [{ required: true, message: '请输入新密码' }, { min: 4, max: 16, message: '密码长度为 4-16 位' }],
  confirmPassword: [
    { min: 4, max: 16, message: '密码长度为 4-16 位' },
    { required: true, message: '请再次输入新密码' },
    { validator: (value, model) => value === model.password || '两次输入的密码不一致' },
  ],
})
const formRef = ref<FormInstance>() // 表单组件引用

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

/** 提交表单 */
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
