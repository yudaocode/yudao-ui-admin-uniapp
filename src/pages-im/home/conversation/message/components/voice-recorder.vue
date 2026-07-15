<template>
  <view
    class="box-border h-75rpx w-full flex touch-none select-none items-center justify-center text-center text-30rpx font-medium active:bg-[#ededed]"
    @contextmenu.prevent
    @touchstart.stop.prevent="handlePressStart"
    @touchmove.stop.prevent="handlePressMove"
    @touchend.stop.prevent="handlePressEnd"
    @touchcancel.stop.prevent="handlePressCancel"
  >
    {{ buttonText }}

    <!-- 录音反馈浮层 -->
    <wd-root-portal>
      <view
        v-if="pressing"
        class="pointer-events-none fixed inset-0 z-[90] overflow-hidden bg-[rgba(0,0,0,0.64)]"
      >
        <!-- 录音波形 -->
        <view
          class="absolute left-1/2 top-[46%] h-140rpx w-280rpx flex items-center justify-center rounded-24rpx transition-colors duration-150 -translate-x-1/2 -translate-y-1/2"
          :class="cancelPending ? 'bg-[#fa5151]' : 'bg-[#95ec69]'"
        >
          <view class="relative z-1 h-58rpx flex items-center gap-6rpx">
            <view
              v-for="(heightClass, index) in voiceWaveHeights"
              :key="index"
              class="w-5rpx animate-pulse rounded-full transition-colors duration-150"
              :class="[heightClass, cancelPending ? 'bg-white opacity-90' : 'bg-[#237a48] opacity-75']"
            />
          </view>
          <view
            class="absolute bottom-[-8rpx] left-1/2 h-20rpx w-20rpx rotate-45 transition-colors duration-150 -translate-x-1/2"
            :class="cancelPending ? 'bg-[#fa5151]' : 'bg-[#95ec69]'"
          />
        </view>

        <!-- 仅保留上滑取消，不提供转文字入口 -->
        <view
          class="absolute bottom-270rpx left-1/2 whitespace-nowrap rounded-999rpx px-38rpx py-18rpx text-28rpx text-white transition-colors duration-150 -translate-x-1/2"
          :class="cancelPending ? 'bg-[#fa5151]' : 'bg-[rgba(0,0,0,0.28)]'"
        >
          {{ cancelPending ? '松开取消' : '上滑取消' }}
        </view>

        <!-- 底部发送弧面 -->
        <view class="absolute inset-x-0 bottom-0 h-260rpx overflow-hidden">
          <view
            class="absolute bottom-[-80rpx] left-[-15vw] h-320rpx w-[130vw] rounded-t-[50%] transition-colors duration-150"
            :class="cancelPending ? 'bg-[#fff0f0]' : 'bg-[#f7f7f7]'"
          >
            <text
              class="absolute left-1/2 top-70rpx whitespace-nowrap text-30rpx font-medium -translate-x-1/2"
              :class="cancelPending ? 'text-[#e64340]' : 'text-[#333]'"
            >
              {{ cancelPending ? '松开 取消' : '松开 发送' }}
            </text>
          </view>
        </view>
      </view>
    </wd-root-portal>
  </view>
</template>

<script lang="ts" setup>
import type { AudioMessage } from '@/pages-im/utils/message'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onUnmounted, ref } from 'vue'
import { MESSAGE_VOICE_MAX_BYTES } from '@/pages-im/utils/config'
import { useMediaUploader } from '../../../composables/useMediaUploader'
// #ifndef H5
import { createNativeRecorderClient } from './native-recorder-manager'
// #endif

type StopIntent = 'send' | 'discard'

const emit = defineEmits<{
  send: [payload: AudioMessage]
}>()

const toast = useToast()
const { validateFileSize, uploadLocalFile, uploadBlob } = useMediaUploader()
const sending = ref(false) // 语音发送中
const recording = ref(false) // 语音录制中
const pressing = ref(false) // 是否仍按住录音按钮
const starting = ref(false) // 等待录音权限或底层启动
const cancelPending = ref(false) // 松手后是否取消本次录音
const cancelEnterDistance = Math.min(72, Math.max(48, uni.getSystemInfoSync().windowWidth * 0.16)) // 进入取消态的上滑距离（px）
const cancelExitDistance = cancelEnterDistance * 0.7 // 滑回发送态的距离（px）
const voiceWaveHeights = [ // 录音反馈波形高度
  'h-18rpx',
  'h-30rpx',
  'h-42rpx',
  'h-24rpx',
  'h-52rpx',
  'h-36rpx',
  'h-56rpx',
  'h-32rpx',
  'h-48rpx',
  'h-26rpx',
  'h-40rpx',
  'h-22rpx',
]
let h5Recorder: MediaRecorder | null = null
let h5RecorderStream: MediaStream | null = null
let h5RecorderChunks: Blob[] = []
let stopIntent: StopIntent = 'discard'
let pressStartY: number | undefined
let recordingSessionId = 0
let disposed = false

const buttonText = computed(() => { // 录音按钮文案
  if (sending.value) {
    return '发送中'
  }
  if (!pressing.value) {
    return '按住 说话'
  }
  return cancelPending.value ? '松开 取消' : '松开 结束'
})

// #ifndef H5
const nativeRecorderClient = createNativeRecorderClient({ // 原生录音 client；由单例适配器路由全局事件
  /** 原生录音真正开始 */
  onStart: () => {
    starting.value = false
    recording.value = true
  },
  /** 原生录音停止后按意图上传或丢弃 */
  onStop: async (res) => {
    recording.value = false
    starting.value = false
    resetInteraction()
    if (disposed || res.intent === 'discard' || !res.tempFilePath) {
      return
    }
    if (res.durationMs < 1000) {
      toast.show('说话时间太短')
      return
    }
    sending.value = true
    try {
      const url = await uploadLocalFile(res.tempFilePath, 'im/voice')
      if (!disposed) {
        emit('send', {
          url,
          duration: Math.max(1, Math.round(res.durationMs / 1000)),
          size: res.fileSize,
        })
      }
    } catch {
      // 上传接口已统一提示错误，事件回调在此承接 Promise 拒绝
    } finally {
      sending.value = false
    }
  },
  /** 原生录音错误时重置交互状态 */
  onError: (_error, intent) => {
    stopIntent = 'discard'
    recording.value = false
    starting.value = false
    sending.value = false
    resetInteraction()
    if (!disposed && intent !== 'discard') {
      toast.error('录音失败')
    }
  },
})
// #endif

/** 开始录音 */
async function startRecording(sessionId: number) {
  if (sending.value || starting.value || recording.value) {
    return
  }
  starting.value = true
  // #ifdef H5
  await startH5Recording(sessionId)
  // #endif
  // #ifndef H5
  const result = nativeRecorderClient.start()
  if (result !== 'started') {
    starting.value = false
    resetInteraction()
    if (result === 'busy') {
      toast.show('录音功能正忙，请稍后再试')
    } else {
      toast.error('当前端暂不支持录音')
    }
  }
  // #endif
}

/** 按住开始录音 */
function handlePressStart(event: TouchEvent) {
  if (sending.value || starting.value || recording.value || pressing.value) {
    return
  }
  const touch = event.changedTouches[0] || event.touches[0]
  if (!touch) {
    return
  }
  pressStartY = touch.clientY
  pressing.value = true
  cancelPending.value = false
  stopIntent = 'send'
  const sessionId = ++recordingSessionId
  startRecording(sessionId)
}

/** 更新上滑取消状态 */
function handlePressMove(event: TouchEvent) {
  if (!pressing.value) {
    return
  }
  const touch = event.touches[0] || event.changedTouches[0]
  if (touch) {
    updateCancelPending(touch.clientY)
  }
}

/** 松开结束录音 */
function handlePressEnd(event: TouchEvent) {
  if (!pressing.value) {
    return
  }
  const touch = event.changedTouches[0]
  if (touch) {
    updateCancelPending(touch.clientY)
  }
  finishRecording(cancelPending.value)
}

/** 触摸中断时取消录音 */
function handlePressCancel() {
  if (pressing.value) {
    finishRecording(true)
  }
}

/** 根据手指纵向位置切换发送 / 取消态 */
function updateCancelPending(clientY: number) {
  if (pressStartY === undefined) {
    return
  }
  const distance = pressStartY - clientY
  cancelPending.value = cancelPending.value
    ? distance > cancelExitDistance
    : distance >= cancelEnterDistance
}

/** 结束本次按压并停止底层录音 */
function finishRecording(discard: boolean) {
  const intent: StopIntent = discard ? 'discard' : 'send'
  stopIntent = intent
  const shouldStop = starting.value || recording.value // 启动中松手也要向原生适配器登记停止意图
  resetInteraction()
  if (shouldStop) {
    stopRecording(intent)
  }
}

/** 停止底层录音 */
function stopRecording(intent: StopIntent) {
  // #ifdef H5
  if (h5Recorder?.state === 'recording' || h5Recorder?.state === 'paused') {
    h5Recorder.stop()
  }
  // #endif
  // #ifndef H5
  nativeRecorderClient.stop(intent)
  // #endif
}

/** 重置按压交互 */
function resetInteraction() {
  pressing.value = false
  cancelPending.value = false
  pressStartY = undefined
}

/** 释放 H5 麦克风 */
function releaseH5Stream() {
  h5RecorderStream?.getTracks().forEach(track => track.stop())
  h5RecorderStream = null
}

/** 开始 H5 录音 */
async function startH5Recording(sessionId: number) {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    starting.value = false
    resetInteraction()
    toast.show('当前浏览器不支持录音')
    return
  }
  try {
    h5RecorderStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // 麦克风授权返回时按压或会话已失效，立即释放资源
    if (disposed || sessionId !== recordingSessionId || !pressing.value) {
      releaseH5Stream()
      starting.value = false
      return
    }
    h5RecorderChunks = []
    const recorder = new MediaRecorder(h5RecorderStream)
    h5Recorder = recorder
    const startedAt = Date.now()
    /** 收集 H5 录音分片 */
    recorder.ondataavailable = event => event.data.size && h5RecorderChunks.push(event.data)
    /** H5 录音错误时丢弃当前会话 */
    recorder.onerror = () => {
      stopIntent = 'discard'
      resetInteraction()
      if (recorder.state !== 'inactive') {
        recorder.stop()
      } else {
        recording.value = false
        starting.value = false
        h5RecorderChunks = []
        releaseH5Stream()
        h5Recorder = null
      }
      if (!disposed) {
        toast.error('录音失败')
      }
    }
    /** H5 录音停止后按意图上传或丢弃 */
    recorder.onstop = async () => {
      const intent = stopIntent
      stopIntent = 'discard'
      recording.value = false
      starting.value = false
      resetInteraction()
      releaseH5Stream()
      h5Recorder = null
      const duration = Date.now() - startedAt
      if (disposed || intent === 'discard') {
        h5RecorderChunks = []
        return
      }
      if (duration < 1000) {
        h5RecorderChunks = []
        toast.show('说话时间太短')
        return
      }
      const blob = new Blob(h5RecorderChunks, { type: recorder.mimeType || 'audio/webm' })
      h5RecorderChunks = []
      if (!blob.size || !validateFileSize(blob.size, MESSAGE_VOICE_MAX_BYTES)) {
        return
      }
      sending.value = true
      try {
        const url = await uploadBlob(blob, `voice-${Date.now()}.webm`, 'im/voice')
        if (!disposed) {
          emit('send', {
            url,
            duration: Math.round(duration / 1000),
            size: blob.size,
          })
        }
      } catch {
        if (!disposed) {
          toast.error('语音发送失败')
        }
      } finally {
        sending.value = false
      }
    }
    recorder.start()
    recording.value = true
    starting.value = false
  } catch {
    starting.value = false
    stopIntent = 'discard'
    resetInteraction()
    releaseH5Stream()
    if (!disposed) {
      toast.error('请允许浏览器使用麦克风')
    }
  }
}

/** 卸载时停止录音并释放麦克风 */
onUnmounted(() => {
  disposed = true
  recordingSessionId += 1
  stopIntent = 'discard'
  resetInteraction()
  // #ifndef H5
  nativeRecorderClient.dispose()
  // #endif
  if (h5Recorder?.state === 'recording') {
    h5Recorder.stop()
  }
  releaseH5Stream()
})
</script>
