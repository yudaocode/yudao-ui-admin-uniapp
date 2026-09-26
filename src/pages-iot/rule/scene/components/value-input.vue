<template>
  <view v-if="isRangeOperator(operator)" class="flex items-center gap-12rpx">
    <view class="min-w-0 flex-1">
      <wd-input v-model="rangeStart" placeholder="请输入起始值" />
    </view>
    <text class="text-[#999]">至</text>
    <view class="min-w-0 flex-1">
      <wd-input v-model="rangeEnd" placeholder="请输入结束值" />
    </view>
  </view>
  <wd-input v-else :model-value="modelValue ?? ''" placeholder="请输入比较值" @update:model-value="emit('update:modelValue', $event)" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { isRangeOperator } from '@/pages-iot/utils/sceneRule'

const props = defineProps<{ modelValue?: string, operator?: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const rangeStart = computed({ // 范围起点
  get: () => (props.modelValue ?? '').split(',')[0] ?? '',
  set: value => updateRange(0, value),
})
const rangeEnd = computed({ // 范围终点
  get: () => (props.modelValue ?? '').split(',')[1] ?? '',
  set: value => updateRange(1, value),
})

/** 更新范围值，保留另一侧输入 */
function updateRange(index: number, value: string) {
  const parts = [rangeStart.value, rangeEnd.value]
  parts[index] = value
  emit('update:modelValue', parts.join(','))
}
</script>
