<template>
  <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;" @close="handleClose">
    <view class="p-32rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">修改用户积分</text>
        <wd-icon name="close" size="20px" @click="handleClose" />
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-form-item title="用户编号" title-width="190rpx" prop="id">
          <wd-input v-model="formData.id" disabled />
        </wd-form-item>
        <wd-form-item title="用户昵称" title-width="190rpx" prop="nickname">
          <wd-input v-model="formData.nickname" disabled />
        </wd-form-item>
        <wd-form-item title="变动前积分" title-width="190rpx" prop="point">
          <wd-input v-model="formData.point" disabled />
        </wd-form-item>
        <wd-form-item title="变动类型" title-width="190rpx" prop="changeType" center>
          <wd-radio-group v-model="formData.changeType" type="button">
            <wd-radio :value="1">
              增加
            </wd-radio>
            <wd-radio :value="-1">
              减少
            </wd-radio>
          </wd-radio-group>
        </wd-form-item>
        <wd-form-item title="变动积分" title-width="190rpx" prop="changePoint">
          <wd-input-number v-model="formData.changePoint" :min="0" :precision="0" />
        </wd-form-item>
        <wd-form-item title="变动后积分" title-width="190rpx">
          <text>{{ pointResult }}</text>
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
import { getMemberUser, updateMemberUserPoint } from '@/api/member/user'
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
  point: 0,
  changePoint: 0,
  changeType: 1,
}) // 表单数据
const pointResult = computed(() => formData.value.point + formData.value.changePoint * formData.value.changeType)
const formSchema = createFormSchema({
  changePoint: [
    { required: true, message: '变动积分不能为空' },
    { validator: value => Number(value) > 0 || '变动积分不能小于 1' },
    { validator: () => pointResult.value >= 0 || '变动后的积分不能小于 0' },
  ],
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
      point: user.point || 0,
      changePoint: 0,
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
    await updateMemberUserPoint({
      id: formData.value.id,
      point: formData.value.changePoint * formData.value.changeType,
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
