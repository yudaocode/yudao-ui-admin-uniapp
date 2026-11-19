import type { AiModel } from '@/api/ai/model/model'
import { computed, ref, watch } from 'vue'
import { getModelSimpleList } from '@/api/ai/model/model'
import { AiModelTypeEnum, AiPlatformEnum, AiVideoTypeEnum, getVideoModelCapability, isVideoModelOfType } from '@/utils/constants'

/** 默认模型的本地缓存：分镜列表与单镜页共用 */
interface StoredModels {
  imageModelId?: number // 绘画模型
  videoModelId?: number // 视频模型
  resolution?: string // 分辨率
}

/** 模型转选择器选项 */
export function toModelColumns(models: AiModel[]) {
  return models.map(item => ({ label: item.name || String(item.id), value: item.id }))
}

/**
 * AI 短剧：分镜生成使用的默认模型
 *
 * 绘画模型、视频模型、分辨率按项目缓存在本地，分镜列表与单镜页读取同一份；
 * 对话模型只用于本次操作，不缓存，为空时后端使用默认对话模型
 */
export function useDramaModels(projectId: number) {
  const storageKey = `ai-drama-models:${projectId}`
  const stored: StoredModels = uni.getStorageSync(storageKey) || {}
  const chatModels = ref<AiModel[]>([]) // 对话模型
  const imageModels = ref<AiModel[]>([]) // 绘画模型：不含 Midjourney
  const videoModels = ref<AiModel[]>([]) // 视频生成模型
  const chatModelId = ref<number>() // 对话模型
  const imageModelId = ref(stored.imageModelId) // 默认绘画模型
  const videoModelId = ref(stored.videoModelId) // 默认视频模型
  const resolution = ref(stored.resolution) // 默认分辨率
  const loaded = ref(false) // 模型是否已加载

  /** 所选视频模型可选的分辨率：第一个为默认；为空表示不传 */
  const resolutions = computed(() => {
    const model = videoModels.value.find(item => item.id === videoModelId.value)
    return model ? getVideoModelCapability(model.platform, model.model).resolutions : []
  })

  /** 默认模型摘要：绘画模型 · 视频模型 · 分辨率 */
  const summary = computed(() => [
    imageModels.value.find(item => item.id === imageModelId.value)?.name,
    videoModels.value.find(item => item.id === videoModelId.value)?.name,
    resolution.value,
  ].filter(Boolean).join(' · ') || '未选择')

  watch(resolutions, (list) => { // 切换视频模型后，原分辨率不可选时改为默认分辨率
    if (!list.length) {
      resolution.value = undefined
    } else if (!resolution.value || !list.includes(resolution.value)) {
      resolution.value = list[0]
    }
  })
  watch([imageModelId, videoModelId, resolution], () => {
    uni.setStorageSync(storageKey, {
      imageModelId: imageModelId.value,
      videoModelId: videoModelId.value,
      resolution: resolution.value,
    } satisfies StoredModels)
  })

  /** 加载模型：缓存的模型已不可用时选第一个 */
  async function loadModels() {
    const [chat, image, video] = await Promise.all([
      getModelSimpleList(AiModelTypeEnum.CHAT),
      getModelSimpleList(AiModelTypeEnum.IMAGE),
      getModelSimpleList(AiModelTypeEnum.VIDEO),
    ])
    chatModels.value = chat
    imageModels.value = image.filter(item => item.platform !== AiPlatformEnum.MIDJOURNEY) // Midjourney 不支持
    videoModels.value = video.filter(item => isVideoModelOfType(AiVideoTypeEnum.GENERATE, item.platform, item.model))
    if (!imageModels.value.some(item => item.id === imageModelId.value)) {
      imageModelId.value = imageModels.value[0]?.id
    }
    if (!videoModels.value.some(item => item.id === videoModelId.value)) {
      videoModelId.value = videoModels.value[0]?.id
    }
    loaded.value = true
  }

  return {
    chatModels,
    imageModels,
    videoModels,
    chatModelId,
    imageModelId,
    videoModelId,
    resolution,
    resolutions,
    summary,
    loaded,
    loadModels,
  }
}
