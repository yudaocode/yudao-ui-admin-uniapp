<!-- yd-map 的 H5 实现：百度地图只读预览单个 BD09 坐标点，进入视口时创建、离开视口时移除；仅在 #ifdef H5 中引入 -->
<template>
  <view ref="containerRef" class="relative overflow-hidden">
    <iframe
      v-if="visible && previewHtml"
      :key="previewHtml"
      ref="frameRef"
      :srcdoc="previewHtml"
      class="pointer-events-none block h-full w-full border-0"
      tabindex="-1"
      title="地图预览"
    />
    <view v-if="loadError" class="absolute inset-0 flex items-center justify-center bg-[#f7f8fa] text-24rpx text-[#999]">
      {{ loadError }}
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ComponentPublicInstance } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BAIDU_MAP_PREVIEW_ERROR, buildBaiduMapPreviewHtml } from '@/utils/baidu-map'

const props = withDefaults(defineProps<{
  latitude: number // BD09 纬度
  longitude: number // BD09 经度
  zoom?: number // 缩放级别
}>(), {
  zoom: 16,
})

const containerRef = ref<ComponentPublicInstance>() // 预览容器（H5 view 组件实例）
const frameRef = ref<HTMLIFrameElement>() // 预览 iframe
const visible = ref(false) // 是否在视口内
const frameFailed = ref(false) // 预览页面是否上报加载失败
let observer: IntersectionObserver | undefined // 视口观察器

/**
 * 预览页面（iframe srcdoc）
 *
 * 百度 GL SDK 的 destroy 会延迟清空实例，并清理同页其他地图共用的样式与全局状态，仍在排队的瓦片回调随后读取已清空的配置而抛错，
 * 公开 API 没有可等待的完成时机。因此每个预览运行在独立 iframe 中且不调用 destroy，离开视口或坐标变化时移除、重建 iframe
 */
const previewHtml = computed(() => buildBaiduMapPreviewHtml(
  { latitude: props.latitude, longitude: props.longitude },
  props.zoom,
))
const loadError = computed(() => {
  if (!previewHtml.value) {
    return import.meta.env.VITE_BAIDU_MAP_KEY ? '坐标无效' : '百度地图 Key 未配置'
  }
  return frameFailed.value ? '百度地图加载失败' : ''
}) // 地图加载异常

/** 获得容器 DOM：H5 的 view 引用是组件实例，实际节点为 $el */
function getContainer() {
  const element = containerRef.value?.$el
  return element instanceof HTMLElement ? element : undefined
}

/** 接收预览页面的加载失败消息，只处理当前 iframe 发出的消息 */
function handleMessage(event: MessageEvent) {
  const frameWindow = frameRef.value?.contentWindow
  if (frameWindow && event.source === frameWindow && event.data?.type === BAIDU_MAP_PREVIEW_ERROR) {
    frameFailed.value = true
  }
}

// 重新进入视口或坐标变化时会创建新的预览页面，清除上一次的失败状态
watch([visible, previewHtml], () => {
  frameFailed.value = false
})

onMounted(() => {
  window.addEventListener('message', handleMessage)
  const container = getContainer()
  if (!container) {
    return
  }
  if (typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      visible.value = entry.isIntersecting
    }
  }, { rootMargin: '100px' })
  observer.observe(container)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  observer?.disconnect()
  observer = undefined
})
</script>
