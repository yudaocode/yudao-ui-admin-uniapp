<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    custom-style="border-radius: 24rpx 24rpx 0 0;"
    safe-area-inset-bottom
    @close="handleClose"
  >
    <view class="p-32rpx">
      <view class="mb-32rpx text-center text-32rpx text-[#333] font-semibold">
        修改密码
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="旧密码" title-width="160rpx" prop="oldPassword">
            <wd-input
              v-model="formData.oldPassword"
              placeholder="请输入旧密码"
              show-password
              clearable
            />
          </wd-form-item>
          <wd-form-item title="新密码" title-width="160rpx" prop="newPassword">
            <wd-input
              v-model="formData.newPassword"
              placeholder="请输入新密码"
              show-password
              clearable
            />
          </wd-form-item>
          <wd-form-item title="确认密码" title-width="160rpx" prop="confirmPassword">
            <wd-input
              v-model="formData.confirmPassword"
              placeholder="请再次输入新密码"
              show-password
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-30rpx">
        <wd-button block type="primary" :loading="submitting" @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, reactive, ref, watch } from 'vue'
import { updateUserPassword } from '@/api/system/user/profile'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  modelValue: boolean
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

const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
}) // 表单数据
const formSchema = createFormSchema({
  oldPassword: [{ required: true, message: '请输入旧密码' }, { min: 4, max: 16, message: '密码长度为 4-16 位' }],
  newPassword: [{ required: true, message: '请输入新密码' }, { min: 4, max: 16, message: '密码长度为 4-16 位' }],
  confirmPassword: [
    { min: 4, max: 16, message: '密码长度为 4-16 位' },
    { required: true, message: '请确认新密码' },
    { validator: (value, model) => value === model.newPassword || '两次输入的密码不一致' },
  ],
})
const formRef = ref<FormInstance>() // 表单组件引用
const submitting = ref(false) // 表单提交状态

/** 监听弹窗打开，重置表单 */
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      formData.oldPassword = ''
      formData.newPassword = ''
      formData.confirmPassword = ''
    }
  },
)

/** 处理关闭 */
function handleClose() {
  visible.value = false
}

/** 处理确认 */
async function handleConfirm() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  submitting.value = true
  try {
    await updateUserPassword({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    })
    toast.success('密码修改成功')
    handleClose()
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
