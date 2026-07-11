<template>
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :is-link="!disabled"
    :value="displayValue"
    :placeholder="placeholder"
    @click="handleOpen"
  />

  <UserPicker ref="pickerRef" :account-id="accountId" @confirm="handleConfirm" />
</template>

<script lang="ts" setup>
import type { MpUser } from '@/api/mp/user'
import { computed, ref, watch } from 'vue'
import { getUser } from '@/api/mp/user'
import UserPicker from './user-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  accountId?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '用户',
  labelWidth: '220rpx',
  placeholder: '请选择用户',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [user: MpUser | undefined]
}>()

const pickerRef = ref<InstanceType<typeof UserPicker>>() // 用户选择器
const selectedUser = ref<MpUser>() // 当前用户
const displayValue = computed(() => {
  if (selectedUser.value) {
    return selectedUser.value.nickname || selectedUser.value.openid || '-'
  }
  return props.modelValue ? String(props.modelValue) : ''
})

/** 打开选择器 */
function handleOpen() {
  if (props.disabled || !props.accountId) {
    return
  }
  pickerRef.value?.open(selectedUser.value)
}

/** 选择用户 */
function handleConfirm(users: MpUser[]) {
  const user = users[0]
  if (!user || user.id == null) {
    return
  }
  selectedUser.value = user
  emit('update:modelValue', user.id)
  emit('change', user)
}

/** 加载用户回显 */
async function resolveUser(id?: number) {
  if (id == null) {
    selectedUser.value = undefined
    return
  }
  if (selectedUser.value?.id === id) {
    return
  }
  try {
    selectedUser.value = await getUser(id)
  } catch {
    selectedUser.value = undefined
  }
}

/** 格式化用户编号 */
function format(value?: number) {
  if (selectedUser.value?.id === value) {
    return selectedUser.value.nickname || selectedUser.value.openid || String(value)
  }
  return value == null ? '' : String(value)
}

defineExpose({ format })

watch(
  () => props.modelValue,
  value => resolveUser(value),
  { immediate: true },
)
</script>
