<template>
  <!-- 本地：live-pusher 推流；摄像头关闭时缩到最小继续推送声音，露出头像 -->
  <!-- 微信 live-pusher 支持 mode="RTC"、aspect="3:4"；当前 uni-helper 类型的 mode 只有 SD/HD/FHD，aspect 误定义为 number -->
  <!-- @vue-expect-error 旧版 live-pusher 类型不含 RTC 模式与字符串宽高比 -->
  <live-pusher
    v-if="isLocal && pushUrl"
    :url="pushUrl"
    mode="RTC"
    :autopush="true"
    :muted="!micEnabled"
    :enable-camera="cameraEnabled"
    aspect="3:4"
    :class="cameraEnabled ? 'rtc-mp-stream' : 'rtc-mp-stream rtc-mp-stream--hidden'"
    @statechange="handlePusherState"
    @error="handlePusherError"
  />
  <!-- 远端：仅在网关确认 SRS 已收到流后拉流，地址变化时重建播放器 -->
  <live-player
    v-else-if="!isLocal && playUrl"
    :id="playerId"
    :key="playUrl"
    :src="playUrl"
    mode="RTC"
    :autoplay="true"
    :muted="!speakerEnabled"
    :min-cache="0.2"
    :max-cache="0.8"
    object-fit="fillCrop"
    :class="videoVisible ? 'rtc-mp-stream' : 'rtc-mp-stream rtc-mp-stream--hidden'"
    @statechange="handlePlayerState"
  />
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, inject, onBeforeUnmount } from 'vue'
import { RTC_MP_STREAM_KEY } from '../../../../composables/useMpGatewayRoom'

const props = defineProps<{
  userId: number // 参与者编号
  isLocal: boolean // 是否当前用户
  videoVisible: boolean // 是否展示画面；否则只播放声音
}>()

const PLAYER_PLAYING_CODE = 2004 // live-player 视频播放开始
const PLAYER_DISCONNECTED_CODE = -2301 // live-player 网络断连且内部多次重连无效，需要业务自行重启播放

const stream = inject(RTC_MP_STREAM_KEY, undefined) // 小程序网关房间提供的媒体状态
const pushUrl = computed(() => stream?.pushUrl.value || '') // 推流地址
const playUrl = computed(() => stream?.playUrls.value.get(props.userId) || '') // 拉流地址
const micEnabled = computed(() => !!stream?.micEnabled.value) // 麦克风状态
const cameraEnabled = computed(() => !!stream?.cameraEnabled.value) // 摄像头状态
const speakerEnabled = computed(() => !!stream?.speakerEnabled.value) // 扬声器状态
const playerId = computed(() => `rtc-mp-player-${props.userId}`) // 原生播放器编号，用于获取播放上下文
const instance = getCurrentInstance() // 当前组件实例，小程序按组件作用域查找播放器
let restartedUrl = '' // 已对该拉流地址尝试过一次原生重启；地址变化后允许再次尝试
let unmounted = false // 组件已卸载，不再操作原生播放器或回写状态

/** 推流状态：摄像头 / 麦克风打开失败交由网关房间判定是否结束通话 */
function handlePusherState(event: { detail: { code: number } }) {
  stream?.handlePusherError(event.detail.code)
}

/** 推流错误：用户拒绝摄像头 / 麦克风授权等 */
function handlePusherError(event: { detail: { errCode: number } }) {
  console.warn('[IM rtc] 小程序推流错误', event.detail.errCode)
  stream?.handlePusherError(event.detail.errCode)
}

/**
 * 拉流状态：断连重试耗尽时先标记该远端画面不可用，再对当前地址重启一次播放
 *
 * 只有收到真正的开始播放事件才恢复；重启调用失败或之后再无事件时保持不可用
 */
function handlePlayerState(event: { detail: { code: number } }) {
  if (unmounted) {
    return
  }
  const code = event.detail.code
  if (code === PLAYER_PLAYING_CODE) {
    stream?.handlePlayerReady(props.userId)
    return
  }
  if (code < 0) {
    console.warn('[IM rtc] 小程序拉流异常', code)
  }
  if (code !== PLAYER_DISCONNECTED_CODE) {
    return
  }
  stream?.handlePlayerFailed(props.userId)
  const url = playUrl.value
  if (!url || restartedUrl === url) {
    return
  }
  restartedUrl = url
  // #ifdef MP-WEIXIN
  uni.createLivePlayerContext(playerId.value, instance?.proxy).play({
    fail: () => {
      if (!unmounted && playUrl.value === url) {
        console.warn('[IM rtc] 小程序拉流重启失败')
      }
    },
  })
  // #endif
}

onBeforeUnmount(() => {
  unmounted = true
})
</script>

<style scoped>
.rtc-mp-stream {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.rtc-mp-stream--hidden {
  width: 2rpx;
  height: 2rpx;
}
</style>
