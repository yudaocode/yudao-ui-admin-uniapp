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
      <wd-input
        v-model="formData.oldPassword"
        label="旧密码"
        placeholder="请输入旧密码"
        show-password
        clearable
      />
      <wd-input
        v-model="formData.newPassword"
        label="新密码"
        placeholder="请输入新密码"
        show-password
        clearable
      />
      <wd-input
        v-model="formData.confirmPassword"
        label="确认密码"
        placeholder="请再次输入新密码"
        show-password
        clearable
      />
      <view class="mt-30rpx">
        <wd-button block type="primary" :loading="submitting" @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'wot-design-uni'
import { updateUserPassword } from '@/api/system/user/profile'
import { isBlank } from '@/utils/validator'

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
})

const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const submitting = ref(false)

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
  // 参数校验
  if (isBlank(formData.oldPassword)) {
    toast.warning('请输入旧密码')
    return
  }
  if (isBlank(formData.newPassword)) {
    toast.warning('请输入新密码')
    return
  }
  if (isBlank(formData.confirmPassword)) {
    toast.warning('请确认新密码')
    return
  }
  if (formData.newPassword !== formData.confirmPassword) {
    toast.warning('两次输入的密码不一致')
    return
  }

  // 调用更新接口
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
