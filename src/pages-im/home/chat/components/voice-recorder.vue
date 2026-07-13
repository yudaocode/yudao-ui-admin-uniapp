<template>
  <view
    class="min-w-0 flex-1 rounded-12rpx bg-[#f7f8fa] py-17rpx text-center text-30rpx font-medium active:bg-[#ddd]"
    @touchstart.prevent="handlePressStart"
    @touchend.prevent="handlePressEnd"
    @touchcancel.prevent="handlePressEnd"
  >
    {{ recording ? '松开 结束' : '按住 说话' }}
  </view>
</template>

<script lang="ts" setup>
import type { ImMediaMessage } from '@/pages-im/utils/message'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref } from 'vue'
import { MESSAGE_VOICE_MAX_BYTES } from '@/pages-im/utils/config'
import { useMediaUploader } from '../../composables/useMediaUploader'

const emit = defineEmits<{
  send: [payload: ImMediaMessage]
}>()

const toast = useToast()
const { validateFileSize, uploadLocalFile, uploadBlob } = useMediaUploader()
const sending = ref(false) // 语音发送中
const recording = ref(false) // 语音录制中
const pressing = ref(false) // 是否仍按住录音按钮
let recorderManager: UniApp.RecorderManager | null = null
let h5Recorder: MediaRecorder | null = null
let h5RecorderStream: MediaStream | null = null
let h5RecorderChunks: Blob[] = []
let disposed = false
// #ifndef H5
recorderManager = uni.getRecorderManager()
// #endif

/** 录制或停止语音 */
async function handleRecord() {
  if (sending.value) {
    return
  }
  // #ifdef H5
  await handleH5Record()
  return
  // #endif
  // #ifndef H5
  if (recording.value) {
    recorderManager?.stop()
    return
  }
  try {
    recorderManager?.start({ duration: 60000, format: 'mp3' })
    recording.value = true
    toast.show('开始录音')
  } catch {
    toast.error('当前端暂不支持录音')
  }
  // #endif
}

/** 按住开始录音 */
function handlePressStart() {
  pressing.value = true
  if (!recording.value) {
    handleRecord()
  }
}

/** 松开结束录音 */
function handlePressEnd() {
  pressing.value = false
  if (recording.value) {
    handleRecord()
  }
}

/** 开始或停止 H5 录音 */
async function handleH5Record() {
  if (recording.value && h5Recorder) {
    h5Recorder.stop()
    return
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    toast.show('当前浏览器不支持录音')
    return
  }
  try {
    h5RecorderStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    if (disposed) {
      h5RecorderStream.getTracks().forEach(track => track.stop())
      return
    }
    h5RecorderChunks = []
    h5Recorder = new MediaRecorder(h5RecorderStream)
    const startedAt = Date.now()
    h5Recorder.ondataavailable = event => event.data.size && h5RecorderChunks.push(event.data)
    h5Recorder.onstop = async () => {
      recording.value = false
      h5RecorderStream?.getTracks().forEach(track => track.stop())
      if (disposed) {
        return
      }
      const blob = new Blob(h5RecorderChunks, { type: h5Recorder?.mimeType || 'audio/webm' })
      if (!blob.size || !validateFileSize(blob.size, MESSAGE_VOICE_MAX_BYTES)) {
        return
      }
      sending.value = true
      try {
        const url = await uploadBlob(blob, `voice-${Date.now()}.webm`, 'im/voice')
        if (!disposed) {
          emit('send', {
            url,
            duration: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
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
    h5Recorder.start()
    recording.value = true
    if (!pressing.value) {
      h5Recorder.stop()
    }
  } catch {
    if (!disposed) {
      toast.error('请允许浏览器使用麦克风')
    }
  }
}

/** 初始化非 H5 录音监听 */
onMounted(() => {
  if (!recorderManager) {
    return
  }
  recorderManager.onStop(async (res) => {
    recording.value = false
    if (disposed || !res.tempFilePath) {
      return
    }
    sending.value = true
    try {
      const url = await uploadLocalFile(res.tempFilePath, 'im/voice')
      if (!disposed) {
        emit('send', {
          url,
          duration: Math.round((res.duration || 0) / 1000),
          size: res.fileSize,
        })
      }
    } catch {
      // 上传接口已统一提示错误，事件回调在此承接 Promise 拒绝
    } finally {
      sending.value = false
    }
  })
  recorderManager.onError(() => {
    recording.value = false
    sending.value = false
    if (!disposed) {
      toast.error('录音失败')
    }
  })
})

/** 卸载时停止录音并释放麦克风 */
onUnmounted(() => {
  disposed = true
  if (recorderManager && recording.value) {
    recorderManager.stop()
  }
  if (h5Recorder?.state === 'recording') {
    h5Recorder.stop()
  }
  h5RecorderStream?.getTracks().forEach(track => track.stop())
})
</script>
