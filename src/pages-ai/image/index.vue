<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="图像生成"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="生成" />
        <wd-tab title="历史" />
        <wd-tab title="作品广场" />
      </wd-tabs>
    </view>

    <!-- 当前生成 -->
    <ImageResult
      v-if="tabIndex === 0"
      :image-data="currentImage"
      :action-loading-id="actionLoadingId"
      @action="handleMidjourneyAction"
    />

    <!-- 历史与广场 -->
    <ImageRecordList
      v-else
      :key="tabIndex"
      ref="recordListRef"
      :public-status="tabIndex === 2"
      :action-loading-id="actionLoadingId"
      @reuse="handleReuse"
      @action="handleMidjourneyAction"
      @delete="handleDelete"
    />

    <!-- 提示词输入栏 -->
    <ImageInputPanel
      v-if="tabIndex === 0"
      :model-value="formData"
      :drawing="drawing"
      :hot-words="hotWords"
      :selected-model-name="selectedModelName"
      @draw="handleDraw"
      @open-settings="settingsVisible = true"
    />

    <!-- 模型与参数设置 -->
    <ImageSettingsPopup
      ref="settingsRef"
      v-model:visible="settingsVisible"
      :form-data="formData"
      :models="models"
      :exclude-platforms="imageSpecialPlatforms"
    />
  </view>
</template>

<script lang="ts" setup>
import type { AiImage, ImageDrawReq, ImageMidjourneyImagineReq } from '@/api/ai/image'
import type { AiModel } from '@/api/ai/model/model'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { deleteImageMy, drawImage, getImageMy, midjourneyAction, midjourneyImagine } from '@/api/ai/image'
import { getModelSimpleList } from '@/api/ai/model/model'
import { navigateBackPlus } from '@/utils'
import { AiImageStatusEnum, AiModelTypeEnum, AiPlatformEnum, Dall3Models, Dall3SizeList, ImageHotEnglishWords, ImageHotWords, MidjourneyModels, MidjourneySizeList } from '@/utils/constants'
import ImageInputPanel from './components/image-input-panel.vue'
import ImageRecordList from './components/image-record-list.vue'
import ImageResult from './components/image-result.vue'
import ImageSettingsPopup from './components/image-settings-popup.vue'

type ImagePlatformMode = 'common' | 'dall3' | 'midjourney' | 'stableDiffusion' // 绘图平台模式

/** 绘图生成表单 */
interface ImageGenerationForm {
  platformMode: ImagePlatformMode
  modelId?: number
  modelKey: string
  prompt: string
  size: string
  style: string
  version: string
  referImageUrl: string
  width: number
  height: number
  sampler: string
  steps: number
  seed: number
  scale: number
  clipGuidancePreset: string
  stylePreset: string
}

/** 绘图记录列表组件暴露方法 */
interface ImageRecordListExpose { reload: () => void }

/** 绘图参数组件暴露方法 */
interface ImageSettingsPopupExpose { validate: () => Promise<{ valid: boolean }> | undefined }

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0) // 当前 Tab 索引
const recordListRef = ref<ImageRecordListExpose>() // 绘图记录列表引用
const settingsRef = ref<ImageSettingsPopupExpose>() // 绘图参数弹窗引用
const settingsVisible = ref(false) // 模型参数弹窗
const currentImage = ref<AiImage>() // 本次生成图片
const models = ref<AiModel[]>([]) // 图片模型列表
const drawing = ref(false) // 图片生成状态
const actionLoadingId = ref('') // MJ 操作加载标识
let pollingTimer: ReturnType<typeof setTimeout> | undefined // 当前图片轮询定时器
const formData = reactive<ImageGenerationForm>({
  platformMode: 'common',
  modelId: undefined,
  modelKey: '',
  prompt: '',
  size: '512x512',
  style: '',
  version: '6.0',
  referImageUrl: '',
  width: 512,
  height: 512,
  sampler: 'DDIM',
  steps: 20,
  seed: 42,
  scale: 7.5,
  clipGuidancePreset: 'NONE',
  stylePreset: '3d-model',
}) // 绘图表单数据
const imageSpecialPlatforms: string[] = [ // 专用绘图平台
  AiPlatformEnum.OPENAI,
  AiPlatformEnum.MIDJOURNEY,
  AiPlatformEnum.STABLE_DIFFUSION,
]
const isCommonMode = computed(() => formData.platformMode === 'common') // 是否通用绘图模式
const isDall3Mode = computed(() => formData.platformMode === 'dall3') // 是否 DALL·E 模式
const isMidjourneyMode = computed(() => formData.platformMode === 'midjourney') // 是否 Midjourney 模式
const hotWords = computed(() => formData.platformMode === 'stableDiffusion' ? ImageHotEnglishWords : ImageHotWords) // 当前平台热门提示词
const selectedModelName = computed(() => { // 当前模型展示名称
  if (isCommonMode.value) {
    const model = models.value.find(item => item.id === formData.modelId)
    return model?.name || model?.model || '请选择模型'
  }
  if (isDall3Mode.value) {
    return Dall3Models.find(item => item.key === formData.modelKey)?.name || 'DALL·E'
  }
  if (isMidjourneyMode.value) {
    return MidjourneyModels.find(item => item.key === formData.modelKey)?.name || 'Midjourney'
  }
  return 'Stable Diffusion'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 生成图片 */
async function handleDraw() {
  const result = await settingsRef.value?.validate()
  if (!result?.valid || drawing.value) {
    return
  }
  if (formData.platformMode === 'stableDiffusion' && /[\u4E00-\u9FFF]/.test(formData.prompt)) {
    toast.warning('Stable Diffusion 暂不支持中文提示词')
    return
  }
  const requestData = buildDrawRequest()
  if (!requestData) {
    return
  }
  drawing.value = true
  try {
    const id = isMidjourneyMode.value
      ? await midjourneyImagine(requestData as ImageMidjourneyImagineReq)
      : await drawImage(requestData as ImageDrawReq)
    currentImage.value = {
      id,
      prompt: formData.prompt,
      status: AiImageStatusEnum.IN_PROGRESS,
    }
    schedulePolling(id)
    toast.success('已提交生成任务')
  } finally {
    drawing.value = false
  }
}

/** 轮询当前图片 */
function schedulePolling(id: number) {
  stopPolling()
  pollingTimer = setTimeout(async () => {
    try {
      const data = await getImageMy(id)
      currentImage.value = data
      if (data.status === AiImageStatusEnum.IN_PROGRESS) {
        schedulePolling(id)
      }
    } catch {
      schedulePolling(id)
    }
  }, 2000)
}

/** 停止图片轮询 */
function stopPolling() {
  if (pollingTimer) {
    clearTimeout(pollingTimer)
    pollingTimer = undefined
  }
}

/** 构建绘图请求 */
function buildDrawRequest(): ImageDrawReq | ImageMidjourneyImagineReq | undefined {
  if (isCommonMode.value) {
    const [width, height] = formData.size.split('x')
    if (!formData.modelId) {
      return undefined
    }
    return {
      prompt: formData.prompt,
      modelId: formData.modelId,
      width: Number(width),
      height: Number(height),
      options: {},
    }
  }
  if (isDall3Mode.value) {
    const model = findModel(AiPlatformEnum.OPENAI, formData.modelKey)
    const imageSize = Dall3SizeList.find(item => item.key === formData.size)
    if (!model || !imageSize) {
      toast.warning('该 DALL·E 模型不可用，请先配置模型')
      return undefined
    }
    return {
      prompt: formData.prompt,
      modelId: model.id,
      width: Number(imageSize.width),
      height: Number(imageSize.height),
      options: { style: formData.style },
    }
  }
  if (isMidjourneyMode.value) {
    const model = findModel(AiPlatformEnum.MIDJOURNEY, formData.modelKey)
    const imageSize = MidjourneySizeList.find(item => item.key === formData.size)
    if (!model || !imageSize) {
      toast.warning('该 Midjourney 模型不可用，请先配置模型')
      return undefined
    }
    return {
      prompt: formData.prompt,
      modelId: model.id,
      width: Number(imageSize.width),
      height: Number(imageSize.height),
      version: formData.version,
      referImageUrl: formData.referImageUrl,
    }
  }
  const model = findModel(AiPlatformEnum.STABLE_DIFFUSION, formData.modelKey)
  if (!model) {
    toast.warning('该 Stable Diffusion 模型不可用，请先配置模型')
    return undefined
  }
  return {
    prompt: formData.prompt,
    modelId: model.id,
    width: formData.width,
    height: formData.height,
    options: {
      seed: String(formData.seed),
      steps: String(formData.steps),
      scale: String(formData.scale),
      sampler: formData.sampler,
      clipGuidancePreset: formData.clipGuidancePreset,
      stylePreset: formData.stylePreset,
    },
  }
}

/** 查找平台模型 */
function findModel(platform: string, model: string) {
  return models.value.find(item => item.platform === platform && item.model === model)
}

/** 复用绘图参数 */
function handleReuse(item: AiImage) {
  formData.prompt = item.prompt || ''
  const platform = item.platform || ''
  if (platform === AiPlatformEnum.OPENAI) {
    formData.platformMode = 'dall3'
    formData.modelKey = item.model || 'dall-e-3'
    formData.size = `${item.width}x${item.height}`
    formData.style = item.options?.style || item.options?.stylePreset || 'vivid'
  } else if (platform === AiPlatformEnum.MIDJOURNEY) {
    formData.platformMode = 'midjourney'
    formData.modelKey = item.options?.model || item.model || 'midjourney'
    formData.size = `${item.width}:${item.height}`
    formData.version = item.options?.version || '6.0'
    formData.referImageUrl = item.options?.referImageUrl || ''
  } else if (platform === AiPlatformEnum.STABLE_DIFFUSION) {
    formData.platformMode = 'stableDiffusion'
    formData.width = Number(item.width || 512)
    formData.height = Number(item.height || 512)
    formData.seed = Number(item.options?.seed ?? 42)
    formData.steps = Number(item.options?.steps ?? 20)
    formData.scale = Number(item.options?.scale ?? 7.5)
    formData.sampler = item.options?.sampler || 'DDIM'
    formData.clipGuidancePreset = item.options?.clipGuidancePreset || 'NONE'
    formData.stylePreset = item.options?.stylePreset || '3d-model'
  } else {
    formData.platformMode = 'common'
    formData.modelId = models.value.find(model => model.platform === platform && model.model === item.model)?.id || formData.modelId
    formData.size = `${item.width}x${item.height}`
    formData.style = item.options?.style || item.options?.stylePreset || ''
  }
  tabIndex.value = 0
}

/** Midjourney 二次操作 */
async function handleMidjourneyAction(item: AiImage, customId: string) {
  if (!item.id) {
    return
  }
  actionLoadingId.value = `${item.id}-${customId}`
  try {
    const id = await midjourneyAction({ id: item.id, customId })
    currentImage.value = {
      id,
      prompt: item.prompt,
      status: AiImageStatusEnum.IN_PROGRESS,
    }
    tabIndex.value = 0
    schedulePolling(id)
    toast.success('已提交操作')
  } finally {
    actionLoadingId.value = ''
  }
}

/** 删除绘图记录 */
async function handleDelete(item: AiImage) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该绘图记录吗？' })
  } catch {
    return
  }
  await deleteImageMy(item.id)
  if (currentImage.value?.id === item.id) {
    currentImage.value = undefined
  }
  toast.success('删除成功')
  recordListRef.value?.reload()
}

/** 应用平台默认参数 */
function applyPlatformDefaults(mode: ImagePlatformMode) {
  if (mode === 'common') {
    formData.size = '512x512'
    formData.style = ''
    formData.modelKey = ''
    formData.modelId = models.value.find(item => !imageSpecialPlatforms.includes(item.platform || ''))?.id
  } else if (mode === 'dall3') {
    formData.modelKey = 'dall-e-3'
    formData.size = '1024x1024'
    formData.style = 'vivid'
  } else if (mode === 'midjourney') {
    formData.modelKey = 'midjourney'
    formData.size = '1:1'
    formData.version = '6.0'
  } else {
    formData.modelKey = 'stable-diffusion-v1-6'
    formData.width = 512
    formData.height = 512
    formData.sampler = 'DDIM'
    formData.clipGuidancePreset = 'NONE'
    formData.stylePreset = '3d-model'
  }
}

/** 初始化图片模型 */
onMounted(async () => {
  try {
    models.value = await getModelSimpleList(AiModelTypeEnum.IMAGE)
    formData.modelId = models.value.find(item => !imageSpecialPlatforms.includes(item.platform || ''))?.id
  } catch {
    models.value = []
  }
})

/** 监听平台变化并重置默认参数 */
watch(() => formData.platformMode, applyPlatformDefaults, { flush: 'sync' })

/** 卸载 */
onUnmounted(stopPolling)
</script>
