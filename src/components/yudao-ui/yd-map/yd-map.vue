<!-- 单点位置地图预览：H5 使用百度地图（BD09），小程序 / App 使用原生 map（GCJ02），坐标按 coordType 在组件内转换 -->
<template>
  <!-- #ifdef H5 -->
  <view v-if="point" class="overflow-hidden active:opacity-70" @click="emit('click')">
    <BaiduMap
      class="pointer-events-none h-full w-full"
      :latitude="point.latitude"
      :longitude="point.longitude"
      :zoom="scale"
    />
  </view>
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <map
    v-if="point"
    :latitude="point.latitude"
    :longitude="point.longitude"
    :markers="markers"
    :scale="scale"
    @tap="emit('click')"
  />
  <!-- #endif -->
</template>

<script lang="ts" setup>
import type { MapCoordinate, MapCoordType } from '@/utils/coordinate'
import { computed } from 'vue'
import { bd09ToGcj02, gcj02ToBd09, NATIVE_MAP_MARKER } from '@/utils/coordinate'
import { toFiniteNumber } from '@/utils/format'
// #ifdef H5
import BaiduMap from './baidu-map.vue'
// #endif

defineOptions({
  options: {
    virtualHost: true, // 小程序下 class / style 合并到根节点 map
  },
})

const props = withDefaults(defineProps<{
  latitude?: number | string // 纬度
  longitude?: number | string // 经度
  coordType?: MapCoordType // 传入坐标系
  scale?: number // 缩放级别
}>(), {
  coordType: 'gcj02',
  scale: 16,
})

const emit = defineEmits<{
  click: []
}>()

/** 当前端地图使用的坐标：H5 为 BD09，其他端为 GCJ02；坐标无效时为 undefined（0 为有效值） */
const point = computed<MapCoordinate | undefined>(() => {
  const latitude = toFiniteNumber(props.latitude)
  const longitude = toFiniteNumber(props.longitude)
  if (latitude === undefined || longitude === undefined) {
    return undefined
  }
  // #ifdef H5
  if (props.coordType === 'gcj02') {
    return gcj02ToBd09(longitude, latitude)
  }
  // #endif
  // #ifndef H5
  if (props.coordType === 'bd09') {
    return bd09ToGcj02(longitude, latitude)
  }
  // #endif
  return { latitude, longitude }
})
const markers = computed<any[]>(() => point.value
  ? [{ id: 0, ...point.value, ...NATIVE_MAP_MARKER }]
  : []) // 原生地图标记
</script>
