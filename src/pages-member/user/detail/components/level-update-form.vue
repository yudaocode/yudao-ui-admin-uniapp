<template>
  <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;" @close="handleClose">
    <view class="p-32rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">修改用户等级</text>
        <wd-icon name="close" size="20px" @click="handleClose" />
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-form-item title="用户编号" title-width="180rpx" prop="id">
          <wd-input v-model="formData.id" disabled />
        </wd-form-item>
        <wd-form-item title="用户昵称" title-width="180rpx" prop="nickname">
          <wd-input v-model="formData.nickname" disabled />
        </wd-form-item>
        <LevelFormPicker v-model="formData.levelId" label="用户等级" prop="levelId" clearable />
        <wd-form-item title="修改原因" title-width="180rpx" prop="reason">
          <wd-textarea
            v-model="formData.reason"
            clearable
            placeholder="请输入修改原因"
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
import { getMemberUser, updateMemberUserLevel } from '@/api/member/user'
import LevelFormPicker from '@/pages-member/level/components/level-form-picker.vue'
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
  levelId: undefined as number | undefined,
  reason: undefined as string | undefined,
}) // 表单数据
const formSchema = createFormSchema({
  reason: [{ required: true, message: '修改原因不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
}

/** 加载会员详情 */
async function loadUser() {
  if (!props.userId) {
    return
  }
  loading.value = true
  try {
    const user = await getMemberUser(Number(props.userId))
    formData.value = {
      id: user.id,
      nickname: user.nickname,
      levelId: user.levelId,
      reason: undefined,
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
    await updateMemberUserLevel(formData.value)
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
