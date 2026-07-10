<template>
  <view v-if="$slots.default" @click="open">
    <slot :value="displayValue" :users="selectedUsers" />
  </view>

  <wd-select-picker
    ref="pickerRef"
    :visible="visible"
    :model-value="pickerValue"
    :title="title"
    :columns="userList"
    value-key="id"
    label-key="nickname"
    :type="type"
    :filterable="filterable"
    root-portal
    :scroll-into-view="false"
    @update:visible="handleVisibleChange"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import { computed, onMounted, ref } from 'vue'
import { useWotSelectPicker } from '@/hooks/useWotSelectPicker'
import { getUserOptions } from './user-options'

const props = withDefaults(defineProps<{
  modelValue?: number | number[]
  type?: 'radio' | 'checkbox'
  title?: string
  disabled?: boolean
  filterable?: boolean
}>(), {
  type: 'radio',
  title: '选择用户',
  disabled: false,
  filterable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  'confirm': [users: User[]]
}>()

const userList = ref<User[]>([]) // 用户选项
const { pickerRef, visible, openPicker, handleVisibleChange } = useWotSelectPicker()
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
  openPicker()
  loadUserOptions()
}

/** 确认用户选择 */
function handleConfirm({ value }: { value: any }) {
  const nextValue = props.type === 'checkbox'
    ? (Array.isArray(value) ? value : []).map(Number)
    : value == null || value === '' ? undefined : Number(Array.isArray(value) ? value[0] : value)
  emit('update:modelValue', nextValue)
  emit('confirm', getSelectedUsers(nextValue))
}

/** 获取已选择用户 */
function getSelectedUsers(value?: number | number[]) {
  const userIds = Array.isArray(value) ? value : value == null ? [] : [value]
  return userList.value.filter(user => user.id != null && userIds.includes(Number(user.id)))
}

/** 格式化用户编号 */
function format(value?: number | number[]) {
  const currentValue = arguments.length > 0 ? value : props.modelValue
  return getSelectedUsers(currentValue).map(user => user.nickname).filter(Boolean).join('、')
}

/** 加载用户选项 */
async function loadUserOptions() {
  try {
    userList.value = await getUserOptions()
  } catch {
    // 请求层负责提示；保留空选项以便下次打开重试。
  }
}

defineExpose({ open, format })

/** 初始化 */
onMounted(() => {
  loadUserOptions()
})
</script>
