<!-- 公众号消息内容展示：按 type 渲染文本/图片/语音/视频/图文/音乐/链接/位置/事件 -->
<template>
  <view>
    <text v-if="type === 'text'">{{ content || '-' }}</text>

    <view v-else-if="type === 'image'">
      <wd-img v-if="mediaUrl" :src="mediaUrl" width="180rpx" height="180rpx" radius="8rpx" mode="aspectFill" enable-preview />
      <text v-else>-</text>
    </view>

    <view v-else-if="type === 'voice'">
      <MediaPreview type="voice" :url="mediaUrl" :format="format" />
      <view v-if="recognition" class="mt-8rpx text-24rpx text-[#999]">
        {{ recognition }}
      </view>
    </view>

    <view v-else-if="type === 'video' || type === 'shortvideo'">
      <view v-if="title" class="mb-8rpx text-28rpx text-[#333]">
        {{ title }}
      </view>
      <view v-if="description" class="mb-8rpx text-24rpx text-[#999]">
        {{ description }}
      </view>
      <MediaPreview type="video" :url="mediaUrl" />
    </view>

    <view v-else-if="type === 'news'">
      <NewsCard :articles="articles" @article-click="article => openUrl(article.url)" />
    </view>

    <view v-else-if="type === 'music'" class="active:opacity-70" @click="openUrl(hqMusicUrl || musicUrl)">
      <wd-img
        v-if="thumbMediaUrl"
        :src="thumbMediaUrl"
        class="mb-12rpx"
        width="160rpx"
        height="160rpx"
        radius="8rpx"
        mode="aspectFill"
      />
      <view class="text-28rpx text-[#333]">
        {{ title || '音乐消息' }}
      </view>
      <view v-if="description" class="mt-8rpx text-24rpx text-[#999]">
        {{ description }}
      </view>
      <view v-if="musicUrl || hqMusicUrl" class="mt-8rpx text-24rpx text-[#576b95]">
        点击播放音乐 ›
      </view>
    </view>

    <view v-else-if="type === 'link'" class="active:opacity-70" @click="openUrl(url)">
      <view class="text-28rpx text-[#333]">
        {{ title || url || '-' }}
      </view>
      <view v-if="description" class="mt-8rpx text-24rpx text-[#999]">
        {{ description }}
      </view>
      <view v-if="url" class="mt-8rpx text-24rpx text-[#576b95]">
        点击打开链接 ›
      </view>
    </view>

    <view v-else-if="type === 'location'">
      <YdMap
        v-if="wxLocation"
        class="w-full rounded-12rpx"
        style="height: 280rpx"
        :latitude="wxLocation.latitude"
        :longitude="wxLocation.longitude"
        coord-type="gcj02"
        :scale="scale || 16"
        @click="handleOpenLocation"
      />
      <view v-if="label" class="mt-8rpx text-26rpx text-[#333]">
        {{ label }}
      </view>
      <view v-if="wxLocation" class="mt-8rpx text-24rpx text-[#576b95]" @click="handleOpenLocation">
        在地图中查看 ›
      </view>
      <text v-else-if="!label">-</text>
    </view>

    <view v-else-if="type === 'event'" class="flex flex-wrap items-center gap-8rpx">
      <wd-tag :type="eventTagType">
        {{ eventLabel }}
      </wd-tag>
      <text v-if="eventKey" class="text-24rpx text-[#999]">
        {{ eventKey }}
      </text>
    </view>

    <text v-else>{{ type || '-' }}</text>
  </view>
</template>

<script lang="ts" setup>
import type { MpArticle } from '@/api/mp/message'
import { computed } from 'vue'
import YdMap from '@/components/yudao-ui/yd-map/yd-map.vue'
import { gcj02ToBd09 } from '@/utils/coordinate'
import { toFiniteNumber } from '@/utils/format'
import { openUrl } from '@/utils/url'
import MediaPreview from './media-preview.vue'
import NewsCard from './news-card.vue'
// #ifdef H5
import { getBaiduMarkerUrl } from '@/utils/baidu-map'
// #endif

type TagType = 'primary' | 'success' | 'danger' | 'warning'

const props = defineProps<{
  type?: string
  content?: string
  mediaUrl?: string
  recognition?: string
  format?: string
  title?: string
  description?: string
  url?: string
  event?: string
  eventKey?: string
  articles?: MpArticle[]
  thumbMediaUrl?: string
  musicUrl?: string
  hqMusicUrl?: string
  locationX?: number // 纬度（微信 GCJ02）
  locationY?: number // 经度（微信 GCJ02）
  scale?: number
  label?: string
}>()

const EVENT_CONFIG: Record<string, { label: string, type: TagType }> = {
  subscribe: { label: '关注', type: 'success' },
  unsubscribe: { label: '取消关注', type: 'danger' },
  CLICK: { label: '点击菜单', type: 'primary' },
  VIEW: { label: '点击菜单链接', type: 'primary' },
  SCAN: { label: '扫码', type: 'success' },
  scancode_waitmsg: { label: '扫码结果', type: 'success' },
  scancode_push: { label: '扫码结果', type: 'success' },
  pic_sysphoto: { label: '系统拍照发图', type: 'warning' },
  pic_photo_or_album: { label: '拍照或者相册', type: 'warning' },
  pic_weixin: { label: '微信相册', type: 'warning' },
  location_select: { label: '选择地理位置', type: 'warning' },
}

const wxLocation = computed(() => {
  const latitude = toFiniteNumber(props.locationX)
  const longitude = toFiniteNumber(props.locationY)
  return latitude === undefined || longitude === undefined ? undefined : { latitude, longitude }
}) // 微信定位（GCJ02）
// #ifdef H5
const baiduPoint = computed(() => wxLocation.value
  ? gcj02ToBd09(wxLocation.value.longitude, wxLocation.value.latitude)
  : undefined) // H5 百度地图标注页坐标（BD09）
// #endif
const eventLabel = computed(() => props.event ? (EVENT_CONFIG[props.event]?.label || '未知事件类型') : '-')
const eventTagType = computed<TagType>(() => props.event ? (EVENT_CONFIG[props.event]?.type || 'danger') : 'primary')

/** 打开位置：H5 打开百度地图标注页，其他端使用原生地图 */
function handleOpenLocation() {
  if (!wxLocation.value) {
    return
  }
  // #ifdef H5
  if (baiduPoint.value) {
    openUrl(getBaiduMarkerUrl(baiduPoint.value, props.label))
  }
  // #endif
  // #ifndef H5
  uni.openLocation({
    ...wxLocation.value,
    name: props.label,
    scale: props.scale || 16,
  })
  // #endif
}
</script>
