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
        {{ title }}
      </view>
      <!-- 昵称输入 -->
      <template v-if="field === 'nickname'">
        <wd-input
          v-model="formValue"
          placeholder="请输入昵称"
          clearable
          :focus="visible"
        />
      </template>
      <!-- 性别选择 -->
      <template v-else-if="field === 'sex'">
        <wd-radio-group v-model="formValue" cell>
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </template>
      <!-- 手机输入 -->
      <template v-else-if="field === 'mobile'">
        <wd-input
          v-model="formValue"
          placeholder="请输入手机号"
          type="number"
          clearable
          :focus="visible"
          :maxlength="11"
        />
      </template>
      <!-- 邮箱输入 -->
      <template v-else-if="field === 'email'">
        <wd-input
          v-model="formValue"
          placeholder="请输入邮箱"
          clearable
          :focus="visible"
        />
      </template>
      <!-- 按钮 -->
      <view class="mt-30rpx">
        <wd-button block type="primary" :loading="submitting" @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'wot-design-uni'
import { updateUserProfile } from '@/api/system/user/profile'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { isBlank, isEmail, isMobile } from '@/utils/validator'

const props = defineProps<{
  modelValue: boolean
  field: 'nickname' | 'sex' | 'mobile' | 'email'
  value: string | number
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
const formValue = ref<string | number>('') // 表单值
const submitting = ref(false) // 提交中状态

const title = computed(() => {
  switch (props.field) {
    case 'nickname':
      return '修改昵称'
    case 'sex':
      return '修改性别'
    case 'mobile':
      return '修改手机'
    case 'email':
      return '修改邮箱'
    default:
      return '修改'
  }
})

/** 监听弹窗打开，初始化值 */
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      formValue.value = props.value
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
  if (props.field === 'sex' && !formValue.value) {
    toast.warning('请选择性别')
    return
  }
  if (props.field !== 'sex' && isBlank(formValue.value as string)) {
    toast.warning(`请输入${title.value.replace('修改', '')}`)
    return
  }
  if (props.field === 'mobile' && !isMobile(formValue.value as string)) {
    toast.warning('请输入正确的手机号')
    return
  }
  if (props.field === 'email' && !isEmail(formValue.value as string)) {
    toast.warning('请输入正确的邮箱')
    return
  }

  // 调用更新接口
  submitting.value = true
  try {
    await updateUserProfile({ [props.field]: formValue.value })
    toast.success('修改成功')
    handleClose()
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
