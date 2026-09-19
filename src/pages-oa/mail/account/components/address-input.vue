<template>
  <view class="px-24rpx py-16rpx">
    <view class="mb-8rpx text-26rpx text-[#666]">
      {{ label }}<text v-if="required" class="text-[#f56c6c]"> *</text>
    </view>
    <view v-if="modelValue.length" class="mb-12rpx flex flex-wrap gap-12rpx">
      <view
        v-for="(address, index) in modelValue"
        :key="address"
        class="flex items-center gap-8rpx rounded-8rpx bg-[#f0f5ff] px-16rpx py-6rpx text-24rpx text-[#1677ff]"
      >
        <text>{{ address }}</text>
        <wd-icon name="close" size="22rpx" @click="removeAddress(index)" />
      </view>
    </view>
    <view class="flex items-center gap-16rpx">
      <wd-input v-model="input" class="flex-1" placeholder="输入邮箱地址后添加" clearable @confirm="addAddress" />
      <wd-button size="small" variant="plain" @click="addAddress">
        添加
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'

const props = withDefaults(defineProps<{
  modelValue?: string[]
  label: string
  required?: boolean
}>(), { modelValue: () => [], required: false })
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
const toast = useToast()
const input = ref('')

/** 添加并校验地址 */
function addAddress() {
  const address = input.value.trim()
  if (!address)
    return
  if (!address.includes('@')) {
    toast.warning('请输入正确的邮箱地址')
    return
  }
  if (props.modelValue.includes(address)) {
    toast.warning('该地址已添加')
    return
  }
  emit('update:modelValue', [...props.modelValue, address])
  input.value = ''
}

/** 删除已选地址 */
function removeAddress(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index))
}
</script>
