<template>
  <!-- 通用模型、Seedream 的创作表单：字段按模型能力显示 -->
  <wd-form ref="formRef" :model="formData" :schema="formSchema">
    <view v-if="capability.status?.legacy" class="bg-[#fffbe6] px-32rpx py-16rpx text-22rpx text-[#fa8c16] leading-34rpx">
      {{ capability.status.legacy }}
    </view>
    <wd-cell-group border>
      <!-- 画面描述 -->
      <wd-form-item title="画面描述" prop="prompt" layout="vertical">
        <wd-textarea
          v-model="formData.prompt"
          :maxlength="capability.promptMax"
          show-word-limit
          clearable
          placeholder="例如：童话里的小屋应该是什么样子？"
        />
      </wd-form-item>
      <view class="flex flex-wrap items-center gap-12rpx px-32rpx pb-20rpx">
        <wd-button size="small" variant="plain" :loading="optimizing" @click="handleOptimizePrompt">
          生成专业绘画指令
        </wd-button>
        <wd-button size="small" variant="plain" @click="handleRandomHotWord">
          随机热词
        </wd-button>
        <wd-tag v-for="hotWord in ImageHotWords" :key="hotWord" variant="plain" @click="formData.prompt = hotWord">
          {{ hotWord }}
        </wd-tag>
      </view>
      <!-- 不希望出现的内容 -->
      <wd-form-item v-if="capability.negativePrompt" title="不希望出现的内容" prop="negativePrompt" layout="vertical">
        <wd-textarea
          v-model="formData.negativePrompt"
          :maxlength="negativePromptMax"
          show-word-limit
          clearable
          placeholder="例如：文字、水印、模糊"
        />
      </wd-form-item>
      <!-- 参考图 -->
      <wd-form-item v-if="capability.reference.max > 0" :title="`参考图（最多 ${capability.reference.max} 张）`" layout="vertical">
        <yd-upload-imgs
          v-model="formData.referenceImageUrls"
          :limit="capability.reference.max"
          :file-size="capability.reference.maxMb"
          :file-type="capability.reference.accept"
          directory="ai/image"
        />
        <view class="mt-8rpx text-22rpx text-[#999]">
          单张 ≤ {{ capability.reference.maxMb }} MB，{{ capability.reference.accept?.join(' / ') }}
        </view>
      </wd-form-item>
      <!-- 尺寸档位（Seedream） -->
      <wd-form-item v-if="capability.sizeMode === 'tier'" title="尺寸档位" layout="vertical">
        <wd-radio-group v-model="formData.sizeLevel" type="button">
          <wd-radio v-for="tier in capability.tiers" :key="tier" :value="tier">
            {{ tier }}
          </wd-radio>
        </wd-radio-group>
        <view class="mt-8rpx text-22rpx text-[#999]">
          按档位提交，画面比例请在描述中说明
        </view>
      </wd-form-item>
      <!-- 尺寸：固定尺寸 / 像素宽高 -->
      <wd-form-item v-else title="尺寸" layout="vertical">
        <view class="grid grid-cols-3 w-full gap-16rpx">
          <view
            v-for="size in capability.sizes"
            :key="size"
            class="border-2rpx rounded-12rpx border-solid py-16rpx text-center"
            :class="getChipClass(!customSize && formData.size === size)"
            @click="handleSizeClick(size)"
          >
            <view class="text-28rpx text-[#333] font-semibold">
              {{ getRatioText(size) }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              {{ size }}
            </view>
          </view>
          <view
            v-if="capability.custom"
            class="border-2rpx rounded-12rpx border-solid py-16rpx text-center"
            :class="getChipClass(customSize)"
            @click="customSize = true"
          >
            <view class="text-28rpx text-[#333] font-semibold">
              自定义
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              {{ capability.custom.min }}–{{ capability.custom.max }}
            </view>
          </view>
        </view>
      </wd-form-item>
      <!-- 自定义宽高 -->
      <template v-if="customSize && capability.custom">
        <wd-form-item title="宽度" title-width="170rpx" prop="width" center>
          <wd-input-number
            v-model="formData.width"
            :min="capability.custom.min"
            :max="capability.custom.max"
            :step="capability.custom.step"
            allow-null
            placeholder="宽度"
          />
        </wd-form-item>
        <wd-form-item title="高度" title-width="170rpx" prop="height" center>
          <wd-input-number
            v-model="formData.height"
            :min="capability.custom.min"
            :max="capability.custom.max"
            :step="capability.custom.step"
            allow-null
            placeholder="高度"
          />
        </wd-form-item>
        <view class="px-32rpx pb-16rpx text-22rpx text-[#999]">
          宽高需为 {{ capability.custom.step }} 的倍数
        </view>
      </template>
      <!-- 画质 -->
      <wd-form-item v-if="capability.qualities?.length" title="画质" layout="vertical">
        <wd-radio-group v-model="formData.quality" type="button">
          <wd-radio v-for="quality in capability.qualities" :key="quality" :value="quality">
            {{ quality }}
          </wd-radio>
        </wd-radio-group>
      </wd-form-item>
    </wd-cell-group>

    <!-- 高级参数、固定参数与写法建议 -->
    <wd-collapse v-if="capability.advanced?.length || capability.fixed?.length" v-model="activeNames" custom-class="mt-24rpx">
      <wd-collapse-item v-if="capability.advanced?.length" title="高级参数" name="advanced">
        <wd-form-item v-if="getAdvanced('seed')" :title="getAdvanced('seed')!.label" title-width="170rpx" center>
          <wd-input-number
            v-model="formData.seed"
            :min="getAdvanced('seed')!.min"
            :max="getAdvanced('seed')!.max"
            allow-null
            :placeholder="getAdvanced('seed')!.placeholder"
          />
        </wd-form-item>
        <wd-form-item v-if="getAdvanced('steps')" :title="getAdvanced('steps')!.label" title-width="170rpx" center>
          <wd-input-number
            v-model="formData.steps"
            :min="getAdvanced('steps')!.min"
            :max="getAdvanced('steps')!.max"
            allow-null
          />
        </wd-form-item>
        <wd-form-item v-if="getAdvanced('cfgScale')" :title="getAdvanced('cfgScale')!.label" title-width="170rpx" center>
          <wd-input-number
            v-model="formData.cfgScale"
            :min="getAdvanced('cfgScale')!.min"
            :max="getAdvanced('cfgScale')!.max"
            :step="getAdvanced('cfgScale')!.step"
            :precision="getAdvanced('cfgScale')!.precision"
            input-type="number"
            allow-null
          />
        </wd-form-item>
        <yd-form-picker
          v-if="getAdvanced('sampler')"
          v-model="formData.sampler"
          :label="getAdvanced('sampler')!.label"
          label-width="170rpx"
          :columns="getAdvanced('sampler')!.options"
        />
        <yd-form-picker
          v-if="getAdvanced('stylePreset')"
          v-model="formData.stylePreset"
          :label="getAdvanced('stylePreset')!.label"
          label-width="170rpx"
          :columns="getAdvanced('stylePreset')!.options"
          :placeholder="getAdvanced('stylePreset')!.placeholder"
          clearable
        />
        <yd-form-picker
          v-if="getAdvanced('clipGuidancePreset')"
          v-model="formData.clipGuidancePreset"
          :label="getAdvanced('clipGuidancePreset')!.label"
          label-width="170rpx"
          :columns="getAdvanced('clipGuidancePreset')!.options"
        />
      </wd-collapse-item>
      <wd-collapse-item v-if="capability.fixed?.length" title="固定参数与写法建议" name="fixed">
        <view class="text-24rpx text-[#666] leading-38rpx">
          <view v-for="item in capability.fixed" :key="item.name" class="mb-8rpx break-all">
            <text class="text-[#333]">{{ item.name }}</text>：{{ item.value }}（{{ item.note }}）
          </view>
          <view v-for="item in capability.guide" :key="item" class="mt-8rpx text-[#999]">
            · {{ item }}
          </view>
        </view>
      </wd-collapse-item>
    </wd-collapse>
  </wd-form>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AiImage, AiImageOptions, ImageDrawReq } from '@/api/ai/image'
import type { AiModel } from '@/api/ai/model/model'
import type { ImageAdvancedField, ImageModelCapability } from '@/utils/constants'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { drawImage, optimizePrompt } from '@/api/ai/image'
import { AiImageInputRoleEnum, getImageSizeRatio, ImageHotWords, parseImageSize } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  model: AiModel // 当前模型
  capability: ImageModelCapability // 当前模型的能力
}>()

const toast = useToast()
const negativePromptMax = 2000 // 与 AiImageDrawReqVO.negativePrompt 上限一致
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<Record<string, any>>(buildInitialFormData()) // 表单数据：高级参数按模型能力动态出现
const customSize = ref(false) // 是否自定义宽高
const optimizing = ref(false) // 生成专业绘画指令状态
const activeNames = ref<string[]>([]) // 展开的折叠面板
const formSchema = createFormSchema(() => ({
  prompt: [{ required: true, message: '请输入画面描述' }],
  width: [
    { required: () => customSize.value, message: '请输入宽度' },
    { validator: value => !customSize.value || isCustomStep(value) || `宽度需为 ${props.capability.custom!.step} 的倍数` },
  ],
  height: [
    { required: () => customSize.value, message: '请输入高度' },
    { validator: value => !customSize.value || isCustomStep(value) || `高度需为 ${props.capability.custom!.step} 的倍数` },
  ],
}))

/** 表单的初始值：取模型能力的第一项、高级参数的默认值 */
function buildInitialFormData() {
  const data: Record<string, any> = {
    prompt: '',
    negativePrompt: '',
    referenceImageUrls: [],
    size: props.capability.sizes?.[0],
    width: undefined,
    height: undefined,
    sizeLevel: props.capability.tiers?.[0],
    quality: props.capability.qualities?.[0],
  }
  props.capability.advanced?.forEach((field) => {
    data[field.key] = field.default
  })
  if (data.size) {
    Object.assign(data, parseImageSize(data.size))
  }
  return data
}

/** 获得高级参数的配置；为空表示当前模型不开放 */
function getAdvanced(key: ImageAdvancedField['key']) {
  return props.capability.advanced?.find(field => field.key === key)
}

/** 尺寸卡片的样式 */
function getChipClass(active: boolean) {
  return active ? 'border-[#1677ff] bg-[#eef4ff]' : 'border-[#e5e5e5]'
}

/** 尺寸换算的比例文案 */
function getRatioText(size: string) {
  const { width, height } = parseImageSize(size)
  return getImageSizeRatio(width, height)
}

/** 自定义宽高是否为步长的倍数 */
function isCustomStep(value: unknown) {
  return Number(value) % props.capability.custom!.step === 0
}

/** 数字输入的值：空值为 undefined；小数输入可能是字符串，转为数字 */
function toNumber(value: unknown) {
  return value === '' || value === null || value === undefined ? undefined : Number(value)
}

/** 选择尺寸 */
function handleSizeClick(size: string) {
  customSize.value = false
  formData.value.size = size
  Object.assign(formData.value, parseImageSize(size))
}

/** 随机热词 */
function handleRandomHotWord() {
  formData.value.prompt = ImageHotWords[Math.floor(Math.random() * ImageHotWords.length)]
}

/** 生成专业绘画指令 */
async function handleOptimizePrompt() {
  if (!formData.value.prompt?.trim()) {
    toast.warning('请先输入画面描述')
    return
  }
  optimizing.value = true
  try {
    const prompt = await optimizePrompt(formData.value.prompt)
    formData.value.prompt = prompt.slice(0, props.capability.promptMax)
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
  const capability = props.capability
  const isTier = capability.sizeMode === 'tier'
  const width = isTier ? undefined : toNumber(data.width)
  const height = isTier ? undefined : toNumber(data.height)
  const reqData: ImageDrawReq = {
    modelId: props.model.id!,
    prompt: data.prompt,
    negativePrompt: capability.negativePrompt ? data.negativePrompt || undefined : undefined,
    referenceImageUrls: capability.reference.max > 0 ? data.referenceImageUrls : undefined,
    width,
    height,
    sizeLevel: isTier ? data.sizeLevel : undefined,
    aspectRatio: isTier ? undefined : getImageSizeRatio(width, height) || undefined,
    quality: capability.qualities?.length ? data.quality : undefined,
    seed: getAdvanced('seed') ? toNumber(data.seed) : undefined,
    steps: getAdvanced('steps') ? toNumber(data.steps) : undefined,
    cfgScale: getAdvanced('cfgScale') ? toNumber(data.cfgScale) : undefined,
    sampler: getAdvanced('sampler') ? data.sampler || undefined : undefined,
    stylePreset: getAdvanced('stylePreset') ? data.stylePreset || undefined : undefined,
    clipGuidancePreset: getAdvanced('clipGuidancePreset') ? data.clipGuidancePreset || undefined : undefined,
  }
  await drawImage(reqData)
  return true
}

/** 重新生成：回填参数；不在当前模型能力内的值不回填 */
function setValues(image: AiImage) {
  const capability = props.capability
  const data = buildInitialFormData()
  data.prompt = image.prompt
  if (capability.negativePrompt) {
    data.negativePrompt = image.negativePrompt || ''
  }
  if (capability.reference.max > 0) {
    data.referenceImageUrls = (image.inputImages || [])
      .filter(item => item.role === AiImageInputRoleEnum.REFERENCE)
      .map(item => item.url)
      .slice(0, capability.reference.max)
  }
  customSize.value = false
  if (capability.sizeMode === 'tier') {
    const size = image.seedreamOptions?.size
    if (size && capability.tiers?.includes(size)) {
      data.sizeLevel = size
    }
  } else if (image.width && image.height) {
    const size = `${image.width}x${image.height}`
    if (capability.sizes?.includes(size)) {
      Object.assign(data, { size, width: image.width, height: image.height })
    } else if (capability.custom) {
      Object.assign(data, { size: undefined, width: image.width, height: image.height })
      customSize.value = true
    }
  }
  const options: AiImageOptions = image.options || {}
  if (options.quality && capability.qualities?.includes(options.quality)) {
    data.quality = options.quality
  }
  capability.advanced?.forEach((field) => {
    const value = options[field.key]
    if (value !== undefined && value !== null) {
      data[field.key] = value
    }
  })
  formData.value = data
}

defineExpose({ submit, setValues })
</script>
