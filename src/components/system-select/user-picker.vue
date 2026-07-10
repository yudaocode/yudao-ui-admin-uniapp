<template>
  <view v-if="$slots.default" @click="open">
    <slot :value="displayValue" :users="selectedUsers" />
  </view>

  <wd-select-picker
    ref="pickerRef"
    :model-value="pickerValue"
    :title="title"
    :columns="userList"
    :loading="loading"
    value-key="id"
    label-key="nickname"
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
const loading = ref(false) // 用户选项加载状态
const pickerRef = ref<SelectPickerInstance>() // 用户选择器
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
