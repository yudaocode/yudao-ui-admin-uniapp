<template>
  <view class="relative w-full" :style="containerStyle">
    <!-- 图表画布 -->
    <LEchart v-show="!loading && !empty" ref="chartRef" />

    <!-- 加载状态 -->
    <view v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <text class="text-26rpx text-[#999]">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="empty" class="absolute inset-0 flex items-center justify-center">
      <text class="text-26rpx text-[#999]">暂无统计数据</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LEchart from '../lime-echart/l-echart.vue'

// #ifdef MP-WEIXIN
import mpEcharts from '../lime-echart/echarts'
// #endif

// #ifndef MP-WEIXIN
import * as echarts from 'echarts/core'
import {
  BarChart,
  FunnelChart,
  GaugeChart,
  LineChart,
  PieChart,
} from 'echarts/charts'
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
// #endif

const props = withDefaults(defineProps<{
  option?: Record<string, any> // ECharts 配置
  height?: string | number // 图表高度
  loading?: boolean // 加载状态
  empty?: boolean // 空状态
  notMerge?: boolean // 是否替换旧配置
}>(), {
  option: () => ({}),
  height: '420rpx',
  loading: false,
  empty: false,
  notMerge: true,
})

const emit = defineEmits<{
  ready: [chart: any]
  click: [params: any]
}>()

// #ifndef MP-WEIXIN
echarts.use([
  BarChart,
  FunnelChart,
  GaugeChart,
  LineChart,
  PieChart,
  CanvasRenderer,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
])
// #endif

const chartRef = ref<any>() // lime-echart 组件引用
let chartInstance: any // ECharts 实例
let renderTimer: ReturnType<typeof setTimeout> | undefined // 延迟渲染定时器
let unmounted = false // 是否已卸载
let initing = false // 图表初始化状态
let renderPending = false // 初始化期间是否有新的渲染请求

const containerStyle = computed(() => { // 容器尺寸
  const height = typeof props.height === 'number' ? `${props.height}rpx` : props.height
  return { height }
})

/** 图表实例是否可操作 */
function canUseChart() {
  return Boolean(chartInstance && !chartInstance.isDisposed?.())
}

/** 初始化图表 */
async function initChart() {
  if (unmounted) {
    return
  }
  if (initing) {
    renderPending = true
    return
  }
  if (props.loading || props.empty || !props.option) {
    return
  }
  await nextTick()
  if (unmounted || props.loading || props.empty || !props.option || !chartRef.value) {
    return
  }
  if (!canUseChart()) {
    initing = true
    try {
      // #ifdef MP-WEIXIN
      chartInstance = await chartRef.value.init(mpEcharts)
      // #endif

      // #ifndef MP-WEIXIN
      chartInstance = await chartRef.value.init(echarts)
      // #endif
    } catch (error) {
      chartInstance = undefined
      if (!unmounted) {
        console.error('初始化图表失败', error)
      }
      return
    } finally {
      initing = false
    }

    if (unmounted) {
      chartInstance?.dispose?.()
      chartInstance = undefined
      return
    }
    if (!canUseChart()) {
      return
    }
    chartInstance?.on?.('click', (params: any) => emit('click', params))
    emit('ready', chartInstance)
  }
  if (unmounted || props.loading || props.empty || !props.option || !canUseChart()) {
    return
  }
  chartInstance?.setOption(props.option, props.notMerge)
  // 容器可能在隐藏（loading / tab 切换）时完成初始化导致画布 0×0，渲染后再量一次尺寸兜底
  resize()
  if (renderPending && !unmounted) {
    scheduleRender()
  }
}

/** 延迟渲染图表，等待容器尺寸稳定 */
function scheduleRender() {
  if (unmounted) {
    return
  }
  renderPending = true
  if (renderTimer) {
    clearTimeout(renderTimer)
  }
  renderTimer = setTimeout(() => {
    renderPending = false
    initChart()
  }, 80)
}

/** 刷新图表尺寸 */
function resize() {
  if (canUseChart()) {
    chartRef.value?.resize?.()
  }
}

/** 设置图表配置 */
function setOption(option: Record<string, any>) {
  if (canUseChart()) {
    chartInstance.setOption(option, props.notMerge)
  }
}

watch(
  () => [props.option, props.loading, props.empty],
  () => scheduleRender(),
  { deep: true },
)

onMounted(() => {
  unmounted = false
  initing = false
  renderPending = false
  scheduleRender()
})

onBeforeUnmount(() => {
  unmounted = true
  renderPending = false
  if (renderTimer) {
    clearTimeout(renderTimer)
    renderTimer = undefined
  }
  if (canUseChart()) {
    chartInstance.dispose()
  }
  chartInstance = undefined
})

defineExpose({
  resize,
  setOption,
  getChart: () => chartInstance,
})
</script>
