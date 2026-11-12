<template>
  <!-- Midjourney 的创作表单：五种模式；参数按版本门禁 -->
  <wd-form ref="formRef" :model="formData" :schema="formSchema">
    <wd-cell-group border>
      <!-- 模式 -->
      <wd-form-item title="模式" layout="vertical">
        <wd-radio-group v-model="mode" type="button">
          <wd-radio v-for="item in MJ_MODES" :key="item.mode" :value="item.mode">
            {{ item.name }}
          </wd-radio>
        </wd-radio-group>
      </wd-form-item>

      <!-- 融图 -->
      <template v-if="mode === AiImageModeEnum.MIDJOURNEY_BLEND">
        <wd-form-item title="融图图片（2–5 张）" prop="blendImageUrls" layout="vertical">
          <yd-upload-imgs
            v-model="formData.blendImageUrls"
            :limit="5"
            :file-size="MJ_IMAGE_MAX_MB"
            :file-type="MJ_IMAGE_ACCEPT"
            directory="ai/image"
          />
        </wd-form-item>
        <wd-form-item title="尺寸" layout="vertical">
          <wd-radio-group v-model="formData.dimensions" type="button">
            <wd-radio v-for="item in MJ_BLEND_DIMENSIONS" :key="item.value" :value="item.value">
              {{ item.label }}
            </wd-radio>
          </wd-radio-group>
        </wd-form-item>
      </template>

      <!-- 换脸 -->
      <template v-else-if="mode === AiImageModeEnum.MIDJOURNEY_SWAP_FACE">
        <wd-form-item title="来源脸" prop="swapSourceUrl" layout="vertical">
          <yd-upload-img v-model="formData.swapSourceUrl" :file-size="MJ_IMAGE_MAX_MB" :file-type="MJ_IMAGE_ACCEPT" directory="ai/image" />
        </wd-form-item>
        <wd-form-item title="目标图" prop="swapTargetUrl" layout="vertical">
          <yd-upload-img v-model="formData.swapTargetUrl" :file-size="MJ_IMAGE_MAX_MB" :file-type="MJ_IMAGE_ACCEPT" directory="ai/image" />
        </wd-form-item>
        <view class="px-32rpx pb-20rpx text-22rpx text-[#999]">
          把来源脸换到目标图上；换脸结果没有 U / V 按钮
        </view>
      </template>

      <!-- 文生图、图生图、一致性 -->
      <template v-else>
        <wd-form-item title="画面描述" prop="prompt" layout="vertical">
          <wd-textarea
            v-model="formData.prompt"
            :maxlength="promptMax"
            show-word-limit
            clearable
            placeholder="例如：a cinematic shot of an ancient Chinese city at night"
          />
        </wd-form-item>
        <view class="flex flex-wrap items-center gap-12rpx px-32rpx pb-20rpx">
          <wd-button size="small" variant="plain" :loading="optimizing" @click="handleOptimizePrompt">
            生成专业绘画指令
          </wd-button>
          <wd-button size="small" variant="plain" @click="handleRandomHotWord">
            随机热词
          </wd-button>
          <wd-tag v-for="hotWord in ImageHotEnglishWords" :key="hotWord" variant="plain" @click="formData.prompt = hotWord">
            {{ hotWord }}
          </wd-tag>
        </view>
        <wd-form-item title="不希望出现的内容（--no）" prop="negativePrompt" layout="vertical">
          <wd-textarea
            v-model="formData.negativePrompt"
            :maxlength="negativePromptMax"
            show-word-limit
            clearable
            placeholder="例如：text, watermark"
          />
        </wd-form-item>

        <!-- 图生图：参考图 -->
        <wd-form-item v-if="mode === AiImageModeEnum.MIDJOURNEY_IMAGE" title="参考图（1–5 张）" prop="referenceImageUrls" layout="vertical">
          <yd-upload-imgs
            v-model="formData.referenceImageUrls"
            :limit="5"
            :file-size="MJ_IMAGE_MAX_MB"
            :file-type="MJ_IMAGE_ACCEPT"
            directory="ai/image"
          />
        </wd-form-item>

        <!-- 版本 -->
        <wd-form-item title="版本" layout="vertical">
          <view class="grid grid-cols-2 w-full gap-16rpx">
            <view
              v-for="item in MJ_VERSIONS"
              :key="item.key"
              class="border-2rpx rounded-12rpx border-solid px-20rpx py-12rpx"
              :class="getChipClass(versionKey === item.key)"
              @click="handleVersionChange(item.key)"
            >
              <view class="text-26rpx text-[#333] font-semibold">
                {{ item.name }}
              </view>
              <view class="mt-4rpx text-22rpx text-[#999]">
                {{ item.badge }}
              </view>
            </view>
          </view>
        </wd-form-item>

        <!-- 比例 -->
        <wd-form-item title="比例" layout="vertical">
          <view class="grid grid-cols-5 w-full gap-12rpx">
            <view
              v-for="ratio in MJ_RATIOS"
              :key="ratio"
              class="border-2rpx rounded-12rpx border-solid py-12rpx text-center text-24rpx text-[#333]"
              :class="getChipClass(formData.aspectRatio === ratio)"
              @click="formData.aspectRatio = ratio"
            >
              {{ ratio }}
            </view>
          </view>
        </wd-form-item>

        <!-- 图生图：图片权重 -->
        <template v-if="mode === AiImageModeEnum.MIDJOURNEY_IMAGE">
          <wd-form-item v-if="version.iw" title="图片权重 --iw" title-width="220rpx" center>
            <wd-input-number
              v-model="formData.imageWeight"
              :min="version.iw.min"
              :max="version.iw.max"
              :step="0.1"
              :precision="1"
              input-type="number"
            />
          </wd-form-item>
          <view v-else class="px-32rpx py-16rpx text-22rpx text-[#999]">
            {{ version.why?.iw }}
          </view>
        </template>

        <!-- 一致性：角色参考、风格参考 -->
        <template v-if="mode === AiImageModeEnum.MIDJOURNEY_CONSISTENCY">
          <wd-form-item title="角色参考 --cref" layout="vertical">
            <template v-if="version.cref">
              <yd-upload-img v-model="formData.crefUrl" :file-size="MJ_IMAGE_MAX_MB" :file-type="MJ_IMAGE_ACCEPT" directory="ai/image" />
            </template>
            <view v-else class="text-22rpx text-[#999]">
              {{ version.why?.cref || '--cref 是旧版角色参考，仅 V6.1、Niji 6 可用' }}
            </view>
          </wd-form-item>
          <wd-form-item v-if="version.cref" title="角色权重 --cw" title-width="220rpx" center>
            <wd-input-number v-model="formData.characterWeight" :min="0" :max="100" />
          </wd-form-item>
          <wd-form-item title="风格参考 --sref" prop="srefUrl" layout="vertical">
            <yd-upload-img v-model="formData.srefUrl" :file-size="MJ_IMAGE_MAX_MB" :file-type="MJ_IMAGE_ACCEPT" directory="ai/image" />
          </wd-form-item>
          <wd-form-item title="风格权重 --sw" title-width="220rpx" center>
            <wd-input-number v-model="formData.styleWeight" :min="0" :max="1000" />
          </wd-form-item>
          <template v-if="version.sv">
            <wd-form-item
              :title="version.sv.min === version.sv.max ? `附加 --sv ${version.sv.min}` : '风格版本 --sv'"
              title-width="220rpx"
              center
            >
              <wd-switch v-model="styleVersionEnabled" />
            </wd-form-item>
            <wd-form-item v-if="styleVersionEnabled && version.sv.min !== version.sv.max" title="--sv 取值" title-width="220rpx" center>
              <wd-input-number v-model="formData.styleVersion" :min="version.sv.min" :max="version.sv.max" />
            </wd-form-item>
          </template>
          <!-- 官方新能力：中转未适配，禁用并说明 -->
          <view v-if="version.omni" class="mx-32rpx my-12rpx border-2rpx border-[#e5e5e5] rounded-12rpx border-dashed p-20rpx text-22rpx text-[#999] leading-34rpx">
            <view class="text-[#666] font-semibold">
              Omni Reference（--oref / --ow）· 暂不可用
            </view>
            {{ MJ_ADAPTER.omniReference.reason }}
          </view>
          <view v-if="version.edit" class="mx-32rpx my-12rpx border-2rpx border-[#e5e5e5] rounded-12rpx border-dashed p-20rpx text-22rpx text-[#999] leading-34rpx">
            <view class="text-[#666] font-semibold">
              V8 Edit（--edit）· 暂不可用
            </view>
            {{ MJ_ADAPTER.edit.reason }}
          </view>
        </template>
      </template>
    </wd-cell-group>

    <!-- 按版本的参数、提交预览：融图、换脸不需要 -->
    <template v-if="isImagineMode">
      <wd-collapse v-model="activeNames" custom-class="mt-24rpx">
        <wd-collapse-item title="更多参数" name="more">
          <wd-form-item v-if="version.quality.length" title="画质 --q" layout="vertical">
            <wd-radio-group v-model="formData.quality" type="button">
              <wd-radio :value="0">
                默认
              </wd-radio>
              <wd-radio v-for="quality in version.quality" :key="quality" :value="quality">
                {{ quality }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="平铺 --tile" title-width="220rpx" center>
            <wd-switch v-model="formData.tile" />
          </wd-form-item>
          <wd-form-item v-if="version.raw" title="RAW --raw" title-width="220rpx" center>
            <wd-switch v-model="formData.raw" />
          </wd-form-item>
          <wd-form-item v-if="version.hd" title="HD --hd" title-width="220rpx" center>
            <wd-switch v-model="formData.hd" />
          </wd-form-item>
          <wd-form-item title="创意度 --c" title-width="220rpx" center>
            <wd-input-number v-model="formData.chaos" :min="0" :max="100" allow-null placeholder="默认" />
          </wd-form-item>
          <wd-form-item title="风格化 --s" title-width="220rpx" center>
            <wd-input-number v-model="formData.stylize" :min="0" :max="1000" allow-null placeholder="默认" />
          </wd-form-item>
          <wd-form-item title="随机种子 --seed" title-width="220rpx" center>
            <wd-input-number v-model="formData.seed" :min="0" :max="4294967295" allow-null placeholder="留空随机" />
          </wd-form-item>
          <view v-if="version.why" class="text-22rpx text-[#999] leading-34rpx">
            <view v-for="(reason, key) in version.why" :key="key">
              {{ reason }}
            </view>
          </view>
        </wd-collapse-item>
      </wd-collapse>
      <view class="mt-24rpx break-all rounded-12rpx bg-white p-24rpx text-22rpx text-[#666] leading-34rpx">
        <view class="mb-8rpx text-[#999]">
          提交预览
        </view>
        {{ finalPrompt }}
      </view>
    </template>
  </wd-form>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AiImage, AiImageMidjourneyOptions, ImageMidjourneyImagineReq } from '@/api/ai/image'
import type { AiModel } from '@/api/ai/model/model'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { midjourneyBlend, midjourneyImagine, midjourneySwapFace, optimizePrompt } from '@/api/ai/image'
import {
  AiImageInputRoleEnum,
  AiImageModeEnum,
  getMjVersion,
  getMjVersionByFlag,
  ImageHotEnglishWords,
  MJ_ADAPTER,
  MJ_BLEND_DIMENSIONS,
  MJ_DEFAULT_VERSION,
  MJ_IMAGE_ACCEPT,
  MJ_IMAGE_MAX_MB,
  MJ_MODES,
  MJ_RATIOS,
  MJ_VERSIONS,
} from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  model: AiModel // 当前模型
}>()

const toast = useToast()
const promptMax = 1200 // 与 AiMidjourneyImagineReqVO.prompt 上限一致
const negativePromptMax = 2000 // 与 AiMidjourneyImagineReqVO.negativePrompt 上限一致
const formRef = ref<FormInstance>() // 表单组件引用
const mode = ref<number>(AiImageModeEnum.MIDJOURNEY_IMAGINE) // 子模式
const formData = ref(buildInitialFormData()) // 表单数据
const versionKey = ref(MJ_DEFAULT_VERSION) // 版本
const version = computed(() => getMjVersion(versionKey.value)) // 当前版本的参数门禁
const styleVersionEnabled = ref(false) // 是否附加 --sv
const optimizing = ref(false) // 生成专业绘画指令状态
const activeNames = ref<string[]>([]) // 展开的折叠面板
const isImagineMode = computed(() => mode.value !== AiImageModeEnum.MIDJOURNEY_BLEND && mode.value !== AiImageModeEnum.MIDJOURNEY_SWAP_FACE) // 文生图、图生图、一致性
const finalPrompt = computed(() => buildMidjourneyPrompt(buildImagineReqData())) // 提交预览：与后端拼接的 finalPrompt 一致
const formSchema = createFormSchema(() => ({
  prompt: [{ required: () => isImagineMode.value, message: '请输入画面描述' }],
  referenceImageUrls: [{ required: () => mode.value === AiImageModeEnum.MIDJOURNEY_IMAGE, message: '图生图至少需要 1 张参考图' }],
  blendImageUrls: [
    { required: () => mode.value === AiImageModeEnum.MIDJOURNEY_BLEND, message: '融图需要 2–5 张图片' },
    { validator: value => mode.value !== AiImageModeEnum.MIDJOURNEY_BLEND || (value as string[]).length >= 2 || '融图需要 2–5 张图片' },
  ],
  swapSourceUrl: [{ required: () => mode.value === AiImageModeEnum.MIDJOURNEY_SWAP_FACE, message: '请上传来源脸' }],
  swapTargetUrl: [{ required: () => mode.value === AiImageModeEnum.MIDJOURNEY_SWAP_FACE, message: '请上传目标图' }],
  srefUrl: [{
    required: () => mode.value === AiImageModeEnum.MIDJOURNEY_CONSISTENCY && !(version.value.cref && formData.value.crefUrl),
    message: '一致性至少需要 1 张角色或风格参考图',
  }],
}))

/** 表单的初始值 */
function buildInitialFormData() {
  return {
    prompt: '',
    negativePrompt: '',
    aspectRatio: '1:1',
    quality: 0, // 0 表示默认：不发送 --q
    stylize: undefined as number | undefined,
    chaos: undefined as number | undefined,
    seed: undefined as number | undefined, // 为空表示随机
    tile: false,
    raw: false,
    hd: false,
    referenceImageUrls: [] as string[],
    imageWeight: 1,
    crefUrl: '',
    characterWeight: 100,
    srefUrl: '',
    styleWeight: 100,
    styleVersion: undefined as number | undefined,
    blendImageUrls: [] as string[], // 融图图片
    dimensions: 'SQUARE', // 融图尺寸
    swapSourceUrl: '', // 换脸：来源脸
    swapTargetUrl: '', // 换脸：目标图
  }
}

/** 选项卡片的样式 */
function getChipClass(active: boolean) {
  return active ? 'border-[#1677ff] bg-[#eef4ff]' : 'border-[#e5e5e5]'
}

/** 数字输入的值：空值为 undefined；小数输入可能是字符串，转为数字 */
function toNumber(value: unknown) {
  return value === '' || value === null || value === undefined ? undefined : Number(value)
}

/** 切换版本：清除新版本不支持的参数（不显示、不发送） */
function handleVersionChange(key: string) {
  versionKey.value = key
  const current = version.value
  const data = formData.value
  if (data.quality && !current.quality.includes(data.quality)) {
    data.quality = 0
  }
  if (!current.raw) {
    data.raw = false
  }
  if (!current.hd) {
    data.hd = false
  }
  data.imageWeight = current.iw ? Math.min(Number(data.imageWeight), current.iw.max) : 1
  if (!current.cref) {
    data.crefUrl = ''
  }
  if (!current.sv) {
    styleVersionEnabled.value = false
  } else {
    data.styleVersion = current.sv.default
  }
}

/** 构建文生图、图生图、一致性的请求 */
function buildImagineReqData(): ImageMidjourneyImagineReq {
  const data = formData.value
  const current = version.value
  const isImage = mode.value === AiImageModeEnum.MIDJOURNEY_IMAGE
  const isConsistency = mode.value === AiImageModeEnum.MIDJOURNEY_CONSISTENCY
  const crefUrl = isConsistency && current.cref && data.crefUrl ? data.crefUrl : undefined
  const srefUrl = isConsistency && data.srefUrl ? data.srefUrl : undefined
  return {
    modelId: props.model.id!,
    mode: mode.value,
    prompt: data.prompt,
    negativePrompt: data.negativePrompt || undefined,
    version: current.flag,
    aspectRatio: data.aspectRatio,
    quality: current.quality.length && data.quality ? data.quality : undefined,
    stylize: toNumber(data.stylize),
    chaos: toNumber(data.chaos),
    seed: toNumber(data.seed),
    tile: data.tile,
    raw: current.raw ? data.raw : false,
    hd: current.hd ? data.hd : false,
    referenceImageUrls: isImage ? data.referenceImageUrls : undefined,
    imageWeight: isImage && current.iw ? toNumber(data.imageWeight) : undefined,
    crefUrl,
    characterWeight: crefUrl ? toNumber(data.characterWeight) : undefined,
    srefUrl,
    styleWeight: srefUrl ? toNumber(data.styleWeight) : undefined,
    styleVersion: srefUrl && current.sv && styleVersionEnabled.value
      ? (toNumber(data.styleVersion) ?? current.sv.default)
      : undefined,
  }
}

/** 提示词预览：与后端 AiImageUtils#buildMidjourneyPrompt 拼接规则一致 */
function buildMidjourneyPrompt(req: ImageMidjourneyImagineReq) {
  const isPresent = (value: unknown) => value !== undefined && value !== null && value !== ''
  const parts: string[] = [(req.prompt || '').trim()]
  if (!(req.prompt || '').toLowerCase().includes('--ar ')) {
    parts.push(`--ar ${req.aspectRatio}`)
  }
  parts.push(req.version)
  if (isPresent(req.quality)) {
    parts.push(`--q ${req.quality}`)
  }
  if (req.tile) {
    parts.push('--tile')
  }
  if (req.raw) {
    parts.push('--raw')
  }
  if (req.hd) {
    parts.push('--hd')
  }
  if (isPresent(req.chaos)) {
    parts.push(`--c ${req.chaos}`)
  }
  if (isPresent(req.stylize)) {
    parts.push(`--s ${req.stylize}`)
  }
  if (isPresent(req.seed) && req.seed! >= 0) {
    parts.push(`--seed ${req.seed}`)
  }
  if (req.referenceImageUrls?.length && isPresent(req.imageWeight)) {
    parts.push(`--iw ${req.imageWeight}`)
  }
  if (req.crefUrl) {
    parts.push(`--cref ${req.crefUrl}`)
    if (isPresent(req.characterWeight)) {
      parts.push(`--cw ${req.characterWeight}`)
    }
  }
  if (req.srefUrl) {
    parts.push(`--sref ${req.srefUrl}`)
    if (isPresent(req.styleWeight)) {
      parts.push(`--sw ${req.styleWeight}`)
    }
    if (isPresent(req.styleVersion)) {
      parts.push(`--sv ${req.styleVersion}`)
    }
  }
  if (req.negativePrompt?.trim()) {
    parts.push(`--no ${req.negativePrompt.trim()}`)
  }
  return parts.join(' ')
}

/** 随机热词 */
function handleRandomHotWord() {
  formData.value.prompt = ImageHotEnglishWords[Math.floor(Math.random() * ImageHotEnglishWords.length)]
}

/** 生成专业绘画指令 */
async function handleOptimizePrompt() {
  if (!formData.value.prompt.trim()) {
    toast.warning('请先输入画面描述')
    return
  }
  optimizing.value = true
  try {
    const prompt = await optimizePrompt(formData.value.prompt)
    formData.value.prompt = prompt.slice(0, promptMax)
  } finally {
    optimizing.value = false
  }
}

/** 提交：校验通过并提交成功时返回 true；loading 由父页面的生成按钮承接 */
async function submit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return false
  }
  const data = formData.value
  if (mode.value === AiImageModeEnum.MIDJOURNEY_BLEND) {
    await midjourneyBlend({ modelId: props.model.id!, imageUrls: data.blendImageUrls, dimensions: data.dimensions })
  } else if (mode.value === AiImageModeEnum.MIDJOURNEY_SWAP_FACE) {
    await midjourneySwapFace({ modelId: props.model.id!, sourceUrl: data.swapSourceUrl, targetUrl: data.swapTargetUrl })
  } else {
    await midjourneyImagine(buildImagineReqData())
  }
  return true
}

/** 重新生成：按原记录的模式回填 */
function setValues(image: AiImage) {
  const getImageUrls = (role: string) => (image.inputImages || []).filter(item => item.role === role).map(item => item.url)
  const options: AiImageMidjourneyOptions = image.midjourneyOptions || {}
  mode.value = MJ_MODES.some(item => item.mode === image.mode) ? image.mode : AiImageModeEnum.MIDJOURNEY_IMAGINE
  const data = buildInitialFormData()
  if (mode.value === AiImageModeEnum.MIDJOURNEY_BLEND) {
    data.blendImageUrls = getImageUrls(AiImageInputRoleEnum.BLEND)
    data.dimensions = options.dimensions || 'SQUARE'
    formData.value = data
    return
  }
  if (mode.value === AiImageModeEnum.MIDJOURNEY_SWAP_FACE) {
    data.swapSourceUrl = getImageUrls(AiImageInputRoleEnum.SWAP_SOURCE)[0] || ''
    data.swapTargetUrl = getImageUrls(AiImageInputRoleEnum.SWAP_TARGET)[0] || ''
    formData.value = data
    return
  }
  // 文生图、图生图、一致性：版本不在常量中时使用默认版本
  versionKey.value = getMjVersionByFlag(options.version)?.key || MJ_DEFAULT_VERSION
  data.prompt = image.prompt
  data.negativePrompt = image.negativePrompt || ''
  if (options.aspectRatio && MJ_RATIOS.includes(options.aspectRatio)) {
    data.aspectRatio = options.aspectRatio
  }
  data.quality = options.quality ?? 0
  data.stylize = options.stylize ?? undefined
  data.chaos = options.chaos ?? undefined
  data.seed = options.seed !== undefined && options.seed !== null && options.seed >= 0 ? options.seed : undefined
  data.tile = !!options.tile
  data.raw = !!options.raw
  data.hd = !!options.hd
  data.referenceImageUrls = getImageUrls(AiImageInputRoleEnum.REFERENCE).slice(0, 5)
  data.imageWeight = options.imageWeight ?? 1
  data.crefUrl = getImageUrls(AiImageInputRoleEnum.CREF)[0] || ''
  data.characterWeight = options.characterWeight ?? 100
  data.srefUrl = getImageUrls(AiImageInputRoleEnum.SREF)[0] || ''
  data.styleWeight = options.styleWeight ?? 100
  formData.value = data
  // 回填后按版本清除不支持的参数
  handleVersionChange(versionKey.value)
  styleVersionEnabled.value = !!version.value.sv && options.styleVersion !== undefined && options.styleVersion !== null
  if (styleVersionEnabled.value) {
    formData.value.styleVersion = options.styleVersion
  }
}

defineExpose({ submit, setValues })
</script>
