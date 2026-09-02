<template>
  <!-- 简单趋势柱：纯 CSS 柱状展示，PMS 不引入 echarts，避免主包体积膨胀 -->
  <view class="flex items-end gap-6rpx" :style="{ height }">
    <view
      v-for="(value, index) in values"
      :key="index"
      class="min-w-0 flex-1 rounded-2rpx"
      :style="{ height: getBarHeight(value), backgroundColor: color }"
    />
  </view>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  values: number[] // 每个柱子的数值
  height?: string // 容器高度
  color?: string // 柱子颜色
}>(), {
  height: '120rpx',
  color: '#1677ff',
})

const maxValue = computed(() => Math.max(0, ...props.values)) // 最大值，用于计算柱子高度占比

/** 计算柱子高度百分比，为 0 时保留最小高度占位 */
function getBarHeight(value: number): string {
  if (maxValue.value <= 0) {
    return '6%'
  }
  return `${Math.max(6, Math.round((value / maxValue.value) * 100))}%`
}
</script>
