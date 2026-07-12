<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    :lazy-render="false"
    custom-style="max-height: 86vh; overflow: auto; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="px-24rpx pb-28rpx pt-24rpx">
      <view class="mb-22rpx flex items-center justify-between px-4rpx">
        <text class="text-32rpx text-[#222] font-semibold">模型与参数</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker
            v-model="formData.platformMode"
            label="绘图平台"
            label-width="170rpx"
            :columns="platformModeOptions"
            placeholder="请选择绘图平台"
          />

          <ModelFormPicker
            v-if="isCommonMode"
            v-model="formData.modelId"
            label="模型"
            label-width="170rpx"
            prop="modelId"
            placeholder="请选择模型"
            :options="models"
            :exclude-platforms="excludePlatforms"
          />
          <yd-form-picker
            v-else-if="isDall3Mode"
            v-model="formData.modelKey"
            label="模型"
            label-width="170rpx"
            prop="modelKey"
            :columns="Dall3Models"
            label-key="name"
            value-key="key"
            placeholder="请选择模型"
          />
          <yd-form-picker
            v-else-if="isMidjourneyMode"
            :model-value="formData.modelKey"
            label="模型"
            label-width="170rpx"
            prop="modelKey"
            :columns="MidjourneyModels"
            label-key="name"
            value-key="key"
            placeholder="请选择模型"
            @confirm="handleMjModelConfirm"
          />

          <template v-if="isCommonMode">
            <yd-form-picker v-model="formData.size" label="尺寸" label-width="170rpx" prop="size" :columns="sizeOptions" placeholder="请选择尺寸" />
            <wd-form-item title="风格" title-width="170rpx">
              <wd-input v-model="formData.style" clearable placeholder="可选，如 anime、cinematic" />
            </wd-form-item>
          </template>

          <template v-else-if="isDall3Mode">
            <yd-form-picker v-model="formData.style" label="风格" label-width="170rpx" :columns="Dall3StyleList" label-key="name" value-key="key" placeholder="请选择风格" />
            <yd-form-picker v-model="formData.size" label="尺寸" label-width="170rpx" prop="size" :columns="dallSizeOptions" placeholder="请选择尺寸" />
          </template>

          <template v-else-if="isMidjourneyMode">
            <yd-form-picker v-model="formData.size" label="比例" label-width="170rpx" prop="size" :columns="mjSizeOptions" placeholder="请选择比例" />
            <yd-form-picker v-model="formData.version" label="版本" label-width="170rpx" :columns="versionOptions" placeholder="请选择版本" />
            <wd-form-item title="参考图 URL" title-width="170rpx">
              <wd-input v-model="formData.referImageUrl" clearable placeholder="可选，输入参考图地址" />
            </wd-form-item>
          </template>

          <template v-else>
            <yd-form-picker v-model="formData.sampler" label="采样方法" label-width="170rpx" :columns="StableDiffusionSamplers" label-key="name" value-key="key" placeholder="请选择采样方法" />
            <yd-form-picker v-model="formData.clipGuidancePreset" label="CLIP" label-width="170rpx" :columns="StableDiffusionClipGuidancePresets" label-key="name" value-key="key" placeholder="请选择 CLIP" />
            <yd-form-picker v-model="formData.stylePreset" label="风格" label-width="170rpx" :columns="StableDiffusionStylePresets" label-key="name" value-key="key" placeholder="请选择风格" />
            <wd-form-item title="宽度" title-width="170rpx">
              <wd-input-number v-model="formData.width" :min="64" :max="2048" />
            </wd-form-item>
            <wd-form-item title="高度" title-width="170rpx">
              <wd-input-number v-model="formData.height" :min="64" :max="2048" />
            </wd-form-item>
            <wd-form-item title="迭代步数" title-width="170rpx">
              <wd-input-number v-model="formData.steps" :min="1" :max="150" />
            </wd-form-item>
            <wd-form-item title="引导系数" title-width="170rpx">
              <wd-input-number v-model="formData.scale" :min="0" :max="30" :step="0.5" />
            </wd-form-item>
            <wd-form-item title="随机因子" title-width="170rpx">
              <wd-input-number v-model="formData.seed" :min="0" :max="999999" />
            </wd-form-item>
          </template>
        </wd-cell-group>
      </wd-form>
      <view class="mt-24rpx">
        <wd-button block type="primary" @click="visible = false">
          完成
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AiModel } from '@/api/ai/model/model'
import { computed, ref } from 'vue'
import ModelFormPicker from '@/pages-ai/model/model/components/model-form-picker.vue'
import { Dall3Models, Dall3SizeList, Dall3StyleList, MidjourneyModels, MidjourneySizeList, MidjourneyVersions, NijiVersionList, StableDiffusionClipGuidancePresets, StableDiffusionSamplers, StableDiffusionStylePresets } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

type ImagePlatformMode = 'common' | 'dall3' | 'midjourney' | 'stableDiffusion'
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

defineProps<{
  excludePlatforms: string[]
  models: AiModel[]
}>()
const visible = defineModel<boolean>('visible', { default: false })
const formData = defineModel<ImageGenerationForm>('formData', { required: true })
const formRef = ref<FormInstance>() // 表单组件引用
const platformModeOptions = [ // 绘图平台选项
  { label: '通用', value: 'common' },
  { label: 'DALL·E', value: 'dall3' },
  { label: 'Midjourney', value: 'midjourney' },
  { label: 'Stable Diffusion', value: 'stableDiffusion' },
]
const sizeOptions = [ // 通用图片尺寸
  { label: '512 x 512', value: '512x512' },
  { label: '768 x 768', value: '768x768' },
  { label: '1024 x 1024', value: '1024x1024' },
  { label: '1024 x 768', value: '1024x768' },
  { label: '768 x 1024', value: '768x1024' },
]
const dallSizeOptions = Dall3SizeList.map(item => ({ label: `${item.name} ${item.key}`, value: item.key }))
const mjSizeOptions = MidjourneySizeList.map(item => ({ label: item.key, value: item.key }))
const isCommonMode = computed(() => formData.value.platformMode === 'common')
const isDall3Mode = computed(() => formData.value.platformMode === 'dall3')
const isMidjourneyMode = computed(() => formData.value.platformMode === 'midjourney')
const versionOptions = computed(() => formData.value.modelKey === 'niji' ? NijiVersionList : MidjourneyVersions)
const formSchema = createFormSchema(() => ({
  modelId: [{ required: () => isCommonMode.value, message: '请选择模型' }],
  modelKey: [{ required: () => isDall3Mode.value || isMidjourneyMode.value, message: '请选择模型' }],
  prompt: [{ required: true, message: '请输入提示词' }],
  size: [{ required: () => formData.value.platformMode !== 'stableDiffusion', message: '请选择尺寸' }],
}))

/** 选择 MJ 模型 */
function handleMjModelConfirm(value: string) {
  formData.value.modelKey = value
  formData.value.version = versionOptions.value[0]?.value || ''
}

/** 校验绘图参数 */
function validate() {
  return formRef.value?.validate()
}

defineExpose({ validate })
</script>
