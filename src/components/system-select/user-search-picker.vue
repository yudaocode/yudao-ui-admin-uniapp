<template>
  <UserPicker
    ref="pickerRef"
    :model-value="modelValue"
    :title="label || placeholder"
    :disabled="disabled"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
  >
    <template #default="{ value }">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          {{ label }}
        </view>
        <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx">
          <text class="min-w-0 flex-1 truncate" :class="value ? 'text-[#333]' : 'text-[#999]'">
            {{ value || placeholder }}
          </text>
          <wd-icon
            v-if="clearable && value"
            name="close-circle"
            size="30rpx"
            custom-style="color: #c0c4cc;"
            @click.stop="handleClear"
          />
        </view>
      </view>
    </template>
  </UserPicker>
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import { ref } from 'vue'
import UserPicker from './user-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '用户',
  placeholder: '请选择用户',
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [user: User | undefined]
  'clear': []
  'confirm': [users: User[]]
}>()

const pickerRef = ref<InstanceType<typeof UserPicker>>() // 用户选择器

/** 更新用户编号 */
function handleUpdate(value: number | number[] | undefined) {
  emit('update:modelValue', Array.isArray(value) ? value[0] : value)
}

/** 确认用户选择 */
function handleConfirm(users: User[]) {
  const user = users[0]
  emit('change', user)
  emit('confirm', users)
}

/** 清空用户 */
function handleClear() {
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}

/** 格式化用户编号 */
function format(value?: number) {
  return arguments.length > 0 ? pickerRef.value?.format(value) || '' : pickerRef.value?.format() || ''
}

defineExpose({ format })
</script>
