<template>
  <view v-if="$slots.default" @click="open">
    <slot :value="displayValue" :users="selectedUsers" />
  </view>

  <wd-select-picker
    ref="pickerRef"
    :model-value="pickerValue"
    :title="title"
    :columns="userOptions"
    :loading="loading"
    value-key="id"
    label-key="pickerLabel"
    :type="type"
    :filterable="filterable"
    root-portal
    :scroll-into-view="false"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { User } from '@/api/system/user'
import { computed, onMounted, ref } from 'vue'
import { getSimpleUserList } from '@/api/system/user'

interface UserPickerOption extends User {
  disabled: boolean
  pickerLabel: string
}

const props = withDefaults(defineProps<{
  modelValue?: number | number[]
  type?: 'radio' | 'checkbox'
  title?: string
  disabled?: boolean
  filterable?: boolean
  hideIds?: number[]
  disabledIds?: number[]
  disabledText?: string
}>(), {
  type: 'radio',
  title: '选择用户',
  disabled: false,
  filterable: true,
  hideIds: () => [],
  disabledIds: () => [],
  disabledText: '不可选择',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  'confirm': [users: User[]]
}>()

const userList = ref<User[]>([]) // 用户选项
const loading = ref(false) // 用户选项加载状态
const pickerRef = ref<SelectPickerInstance>() // 用户选择器
const hideIdSet = computed(() => new Set(props.hideIds)) // 隐藏用户编号
const disabledIdSet = computed(() => new Set(props.disabledIds)) // 禁用用户编号
const userOptions = computed<UserPickerOption[]>(() => userList.value
  .filter(user => user.id == null || !hideIdSet.value.has(user.id))
  .map((user) => {
    const disabled = user.id != null && disabledIdSet.value.has(user.id)
    return {
      ...user,
      disabled,
      pickerLabel: disabled ? `${user.nickname}（${props.disabledText}）` : user.nickname,
    }
  })) // 过滤并标记后的用户选项
const pickerValue = computed(() => {
  if (props.type === 'checkbox') {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }
  return Array.isArray(props.modelValue) ? props.modelValue[0] ?? '' : props.modelValue ?? ''
})
const selectedUsers = computed(() => getSelectedUsers(props.modelValue)) // 已选择用户
const displayValue = computed(() => selectedUsers.value.map(user => user.nickname).filter(Boolean).join('、'))

/** 打开用户选择器 */
function open() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open()
  if (userList.value.length === 0) {
    loadUserOptions()
  }
}

/** 确认用户选择 */
function handleConfirm({ value }: { value: any }) {
  if (loading.value || userList.value.length === 0) {
    return
  }
  const nextValue = props.type === 'checkbox'
    ? (Array.isArray(value) ? value : [])
    : value == null || value === '' ? undefined : value
  emit('update:modelValue', nextValue)
  emit('confirm', getSelectedUsers(nextValue))
}

/** 获取已选择用户 */
function getSelectedUsers(value?: number | number[]) {
  const userIds = Array.isArray(value) ? value : value == null ? [] : [value]
  return userList.value.filter(user => user.id != null && userIds.includes(user.id))
}

/** 格式化用户编号 */
function format(value?: number | number[]) {
  const currentValue = arguments.length > 0 ? value : props.modelValue
  return getSelectedUsers(currentValue).map(user => user.nickname).filter(Boolean).join('、')
}

/** 加载用户选项 */
async function loadUserOptions() {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    userList.value = await getSimpleUserList()
  } catch {
    userList.value = []
  } finally {
    loading.value = false
  }
}

defineExpose({ open, format })

/** 初始化 */
onMounted(loadUserOptions)
</script>
