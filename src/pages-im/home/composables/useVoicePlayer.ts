import { ref } from 'vue'

export type VoiceKey = symbol

const currentKey = ref<VoiceKey>() // 当前播放实例标识
let currentAudio: UniApp.InnerAudioContext | undefined

/** 停止当前语音；传 key 时只停止对应实例 */
function stop(key?: VoiceKey) {
  if (!currentAudio || (key && currentKey.value !== key)) {
    return
  }
  const audio = currentAudio
  currentAudio = undefined
  currentKey.value = undefined
  audio.stop()
  audio.destroy()
}

/** 播放或暂停指定语音 */
function play(key: VoiceKey, url: string) {
  if (!url) {
    return
  }
  if (currentKey.value === key) {
    stop(key)
    return
  }
  stop()
  const audio = uni.createInnerAudioContext()
  const finalize = () => {
    if (currentAudio === audio) {
      currentAudio = undefined
      currentKey.value = undefined
      audio.destroy()
    }
  }
  audio.onEnded(finalize)
  audio.onError(finalize)
  audio.src = url
  currentAudio = audio
  currentKey.value = key
  audio.play()
}

/** 全局互斥语音播放器 */
export function useVoicePlayer() {
  /** 指定实例是否正在播放 */
  function isPlaying(key: VoiceKey) {
    return currentKey.value === key
  }

  return { isPlaying, play, stop }
}
