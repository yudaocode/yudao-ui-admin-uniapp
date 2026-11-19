<template>
  <view class="p-24rpx">
    <!-- 表单区域 -->
    <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <!-- 创作类型 -->
          <wd-form-item title="创作类型" layout="vertical">
            <wd-radio-group :model-value="formData.type" type="button" @change="handleTypeChange">
              <wd-radio :value="AiVideoTypeEnum.GENERATE">
                视频生成
              </wd-radio>
              <wd-radio :value="AiVideoTypeEnum.AVATAR">
                数字人口播
              </wd-radio>
              <wd-radio :value="AiVideoTypeEnum.MOTION">
                动作模仿
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>

          <!-- 服务商、模型 -->
          <VideoModelFormPicker v-model="formData.modelId" :models="typeModels" @change="handleModelChange" />
          <view v-if="modelsLoaded && typeModels.length === 0" class="px-32rpx pb-16rpx text-22rpx text-[#fa8c16] leading-34rpx">
            暂无可用模型，请先在「模型配置」中添加类型为「视频」的模型
          </view>

          <!-- 视频生成：生成方式与对应的输入 -->
          <template v-if="formData.type === AiVideoTypeEnum.GENERATE">
            <wd-form-item title="生成方式" layout="vertical">
              <wd-radio-group v-model="formData.mode" type="button" @change="handleModeChange">
                <wd-radio
                  v-for="item in AI_VIDEO_MODE_OPTIONS"
                  :key="item.value"
                  :value="item.value"
                  :disabled="!capability.modes.includes(item.value)"
                >
                  {{ item.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item v-if="usesFirstFrame" title="首帧图片" prop="inputs.first_frame" layout="vertical">
              <yd-upload-img v-model="formData.inputs.first_frame" :file-size="10" directory="ai/video" />
            </wd-form-item>
            <wd-form-item v-if="formData.mode === AiVideoModeEnum.FIRST_LAST" title="尾帧图片" prop="inputs.last_frame" layout="vertical">
              <yd-upload-img v-model="formData.inputs.last_frame" :file-size="10" directory="ai/video" />
            </wd-form-item>
            <template v-if="formData.mode === AiVideoModeEnum.REFERENCE">
              <wd-form-item :title="`参考图（最多 ${capability.maxReferenceImages} 张）`" prop="inputs.reference_image" layout="vertical">
                <yd-upload-imgs
                  v-model="formData.inputs.reference_image"
                  :limit="capability.maxReferenceImages || 1"
                  :file-size="10"
                  directory="ai/video"
                />
              </wd-form-item>
              <wd-form-item v-if="capability.referenceVideo" title="参考视频" layout="vertical">
                <yd-upload-file
                  v-model="formData.inputs.reference_video"
                  accept="video"
                  :limit="1"
                  :file-size="50"
                  :file-type="['mp4', 'mov']"
                  directory="ai/video"
                />
              </wd-form-item>
              <wd-form-item v-if="capability.referenceAudio" title="参考音频" layout="vertical">
                <yd-upload-file
                  v-model="formData.inputs.reference_audio"
                  :limit="1"
                  :file-size="15"
                  :file-type="['mp3', 'wav']"
                  directory="ai/video"
                />
              </wd-form-item>
            </template>
          </template>

          <!-- 数字人口播、动作模仿：人物图片 + 驱动音频 / 动作视频 -->
          <template v-else>
            <wd-form-item title="人物图片" prop="inputs.image" layout="vertical">
              <yd-upload-img v-model="formData.inputs.image" :file-size="10" directory="ai/video" />
            </wd-form-item>
            <wd-form-item v-if="formData.type === AiVideoTypeEnum.AVATAR" title="驱动音频" prop="inputs.audio" layout="vertical">
              <yd-upload-file
                v-model="formData.inputs.audio"
                :limit="1"
                :file-size="15"
                :file-type="['mp3', 'wav']"
                directory="ai/video"
              />
              <view class="mt-8rpx text-22rpx text-[#999]">
                上传口播音频，时长限制以所选模型为准
              </view>
            </wd-form-item>
            <wd-form-item v-else title="动作视频" prop="inputs.video" layout="vertical">
              <yd-upload-file
                v-model="formData.inputs.video"
                accept="video"
                :limit="1"
                :file-size="50"
                :file-type="['mp4', 'mov']"
                directory="ai/video"
              />
              <view class="mt-8rpx text-22rpx text-[#999]">
                人物将模仿视频中的动作，时长限制以所选模型为准（例如 30 秒内）
              </view>
            </wd-form-item>
          </template>

          <!-- 提示词：动作模仿不需要 -->
          <wd-form-item v-if="formData.type !== AiVideoTypeEnum.MOTION" title="提示词" prop="prompt" layout="vertical">
            <wd-textarea
              v-model="formData.prompt"
              :maxlength="2000"
              show-word-limit
              clearable
              :placeholder="formData.type === AiVideoTypeEnum.AVATAR ? '可选：描述人物动作、表情或镜头' : '描述画面内容、动作与镜头，例如：一只橘猫在雨夜的霓虹街头奔跑，镜头跟随'"
            />
          </wd-form-item>

          <!-- 视频生成参数：按模型能力展示，取值范围由服务端按模型校验 -->
          <template v-if="formData.type === AiVideoTypeEnum.GENERATE">
            <wd-form-item v-if="capability.resolutions.length" title="分辨率" layout="vertical">
              <wd-radio-group v-model="formData.resolution" type="button">
                <wd-radio v-for="item in capability.resolutions" :key="item" :value="item">
                  {{ item }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item v-if="capability.ratios.length" title="比例" layout="vertical">
              <wd-radio-group v-model="formData.ratio" type="button">
                <wd-radio v-for="item in capability.ratios" :key="item" :value="item">
                  {{ item }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <yd-form-picker v-if="hasField('size')" v-model="options.size" label="尺寸" label-width="170rpx" :columns="sizeColumns" />
            <yd-form-picker v-if="capability.durations.length" v-model="formData.duration" label="时长" label-width="170rpx" :columns="durationColumns" />
            <wd-form-item v-if="hasField('negativePrompt')" title="反向提示词" layout="vertical">
              <wd-input v-model="options.negativePrompt" :maxlength="500" clearable placeholder="不希望出现的内容" />
            </wd-form-item>
            <wd-form-item v-if="hasField('quality')" title="生成模式" layout="vertical">
              <wd-radio-group v-model="options.quality" type="button">
                <wd-radio v-for="item in AI_VIDEO_QUALITY_OPTIONS" :key="item.value" :value="item.value">
                  {{ item.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item v-if="hasField('promptExpansionMode')" title="提示词扩写" layout="vertical">
              <wd-radio-group v-model="options.promptExpansionMode" type="button">
                <wd-radio v-for="item in AI_VIDEO_PROMPT_EXPANSION_MODE_OPTIONS" :key="item.value" :value="item.value">
                  {{ item.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <!-- 镜头类型只在优化提示词开启时生效：关闭时隐藏，也不提交 -->
            <wd-form-item v-if="hasField('shotType') && options.promptExtend !== false" title="镜头类型" layout="vertical">
              <wd-radio-group v-model="options.shotType" type="button">
                <wd-radio v-for="item in AI_VIDEO_SHOT_TYPE_OPTIONS" :key="item.value" :value="item.value">
                  {{ item.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item v-if="hasField('generateAudio')" title="生成音频" title-width="170rpx" center>
              <wd-switch v-model="options.generateAudio" />
            </wd-form-item>
            <wd-form-item v-if="hasField('promptExtend')" title="优化提示词" title-width="170rpx" center>
              <wd-switch v-model="options.promptExtend" />
            </wd-form-item>
            <wd-form-item v-if="hasField('cameraFixed')" title="固定镜头" title-width="170rpx" center>
              <wd-switch v-model="options.cameraFixed" />
            </wd-form-item>
            <wd-form-item v-if="hasField('watermark')" title="水印" title-width="170rpx" center>
              <wd-switch v-model="options.watermark" />
            </wd-form-item>
            <wd-form-item v-if="hasField('seed')" title="随机种子" title-width="170rpx" center>
              <wd-input-number v-model="options.seed" :min="0" :precision="0" allow-null placeholder="留空为随机" />
            </wd-form-item>
          </template>
        </wd-cell-group>
      </wd-form>
    </view>

    <view class="mt-16rpx text-22rpx text-[#999] leading-36rpx">
      生成为异步任务，通常需要几分钟；完成后会转存到文件服务并出现在「我的作品」中
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AiModel } from '@/api/ai/model/model'
import type { Video, VideoOptions } from '@/api/ai/video'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getModelSimpleList } from '@/api/ai/model/model'
import { generateVideo } from '@/api/ai/video'
import {
  AI_VIDEO_MODE_OPTIONS,
  AI_VIDEO_PROMPT_EXPANSION_MODE_OPTIONS,
  AI_VIDEO_QUALITY_OPTIONS,
  AI_VIDEO_SHOT_TYPE_OPTIONS,
  AiModelTypeEnum,
  AiVideoModeEnum,
  AiVideoTypeEnum,
  getVideoInputRoles,
  getVideoModelCapability,
  isVideoModelOfType,
} from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import VideoModelFormPicker from './video-model-form-picker.vue'

const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref({ // 表单数据
  type: AiVideoTypeEnum.GENERATE as number,
  mode: AiVideoModeEnum.TEXT as string,
  modelId: undefined as number | undefined,
  prompt: '',
  resolution: undefined as string | undefined,
  ratio: undefined as string | undefined,
  duration: undefined as number | undefined,
  inputs: createEmptyInputs(),
})
const options = ref<VideoOptions>({}) // 其它生成参数
const models = ref<AiModel[]>([]) // 全部视频模型
const modelsLoaded = ref(false) // 模型列表是否已加载
const typeModels = computed(() => models.value.filter(item => isVideoModelOfType(formData.value.type, item.platform, item.model))) // 当前创作类型可用的模型
const selectedModel = computed(() => models.value.find(item => item.id === formData.value.modelId)) // 选中的模型
const capability = computed(() => getVideoModelCapability(selectedModel.value?.platform, selectedModel.value?.model, formData.value.mode, formData.value.duration, options.value.generateAudio)) // 选中模型、生成方式、时长、生成音频的表单能力
const usesFirstFrame = computed(() => formData.value.mode === AiVideoModeEnum.IMAGE || formData.value.mode === AiVideoModeEnum.FIRST_LAST) // 是否使用首帧
const durationColumns = computed(() => capability.value.durations.map(item => ({ label: `${item} 秒`, value: item }))) // 时长选项
const sizeColumns = computed(() => capability.value.sizes.map(item => ({ label: item, value: item }))) // 尺寸选项
const formSchema = createFormSchema(() => { // 只校验必填，参数的取值范围由服务端按模型校验
  const { type, mode } = formData.value
  if (type === AiVideoTypeEnum.AVATAR) {
    return {
      'modelId': [{ required: true, message: '请选择模型' }],
      'inputs.image': [{ required: true, message: '请上传人物图片' }],
      'inputs.audio': [{ required: true, message: '请上传驱动音频' }],
    }
  }
  if (type === AiVideoTypeEnum.MOTION) {
    return {
      'modelId': [{ required: true, message: '请选择模型' }],
      'inputs.image': [{ required: true, message: '请上传人物图片' }],
      'inputs.video': [{ required: true, message: '请上传动作视频' }],
    }
  }
  // 参考素材按实际提交的角色判断：切换模型后隐藏的参考视频、参考音频不提交，也不能抵消缺少的参考图
  const inputUrls = buildInputUrls()
  return {
    'modelId': [{ required: true, message: '请选择模型' }],
    'prompt': [{ required: capability.value.promptRequired, message: '请输入提示词' }],
    'inputs.first_frame': [{ required: usesFirstFrame.value, message: '请上传首帧图片' }],
    'inputs.last_frame': [{ required: mode === AiVideoModeEnum.FIRST_LAST, message: '请上传尾帧图片' }],
    'inputs.reference_image': [{
      required: mode === AiVideoModeEnum.REFERENCE && !inputUrls.reference_image && !inputUrls.reference_video && !inputUrls.reference_audio,
      message: '请上传参考素材',
    }],
  }
})

/** 空的输入文件：单个为字符串，参考图为数组 */
function createEmptyInputs() {
  return {
    first_frame: '',
    last_frame: '',
    reference_image: [] as string[],
    reference_video: '',
    reference_audio: '',
    image: '',
    audio: '',
    video: '',
  }
}

/** 模型是否支持某个额外参数 */
function hasField(field: string) {
  return capability.value.fields.includes(field)
}

/** 选中当前创作类型的第一个模型（即第一个服务商的第一个模型） */
function selectDefaultModel() {
  formData.value.modelId = typeModels.value[0]?.id
  handleModelChange()
}

/** 切换创作类型 */
function handleTypeChange({ value }: { value: unknown }) {
  formData.value.type = value as number
  selectDefaultModel()
}

/** 切换模型：生成方式、参数重置为模型的默认值 */
function handleModelChange() {
  if (!capability.value.modes.includes(formData.value.mode)) {
    formData.value.mode = capability.value.modes[0]
  }
  let cap = capability.value // 生成方式变化后，按新的方式重新计算
  formData.value.duration = cap.durations[0]
  options.value = {
    size: cap.sizes[0],
    quality: cap.fields.includes('quality') ? 'std' : undefined,
    promptExpansionMode: cap.fields.includes('promptExpansionMode') ? 'balanced' : undefined,
    // 万相 2.6：优化提示词默认开启（与服务端默认一致），镜头类型才生效
    promptExtend: cap.fields.includes('shotType') ? true : undefined,
  }
  cap = capability.value // 可选分辨率与时长、生成音频有关，按重置后的值再计算
  formData.value.resolution = cap.resolutions[0]
  formData.value.ratio = cap.ratios[0]
}

/** 切换生成方式、时长、生成音频：分辨率、比例、时长不再可选的，重置为默认值 */
function handleModeChange() {
  const cap = capability.value
  const data = formData.value
  if (!cap.resolutions.includes(data.resolution!)) {
    data.resolution = cap.resolutions[0]
  }
  if (!cap.ratios.includes(data.ratio!)) {
    data.ratio = cap.ratios[0]
  }
  if (!cap.durations.includes(data.duration!)) {
    data.duration = cap.durations[0]
  }
}

// 海螺 10 秒只支持 768P，kling-2.6 生成音频只支持 1080p：时长、生成音频变化后，可选分辨率随之变化
watch(() => [formData.value.duration, options.value.generateAudio], handleModeChange)

/** 构建输入文件：只提交当前类型、方式使用的角色 */
function buildInputUrls() {
  const result: Record<string, string[]> = {}
  const inputs = formData.value.inputs as Record<string, string | string[]>
  const { referenceVideo, referenceAudio } = capability.value
  getVideoInputRoles(formData.value.type, formData.value.mode).forEach((role) => {
    // 切换模型后，已隐藏的参考视频、参考音频不提交
    if ((role === 'reference_video' && !referenceVideo) || (role === 'reference_audio' && !referenceAudio)) {
      return
    }
    const value = inputs[role]
    const urls = (Array.isArray(value) ? value : [value]).filter(url => !!url)
    if (urls.length > 0) {
      result[role] = urls
    }
  })
  return result
}

/** 构建生成参数：只提交模型、生成方式支持的，切换后不适用的、清空的都不提交 */
function buildOptions(): VideoOptions {
  const fields = capability.value.fields
  return Object.fromEntries(Object.entries(options.value)
    // 镜头类型只在优化提示词开启时生效：明确关闭时不提交
    .filter(([key, value]) => fields.includes(key) && value !== undefined && value !== null && value !== ''
      && !(key === 'shotType' && options.value.promptExtend === false)))
}

/** 提交：校验通过并提交成功时返回 true；loading 由父页面的生成按钮承接 */
async function submit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return false
  }
  const data = formData.value
  await generateVideo({
    type: data.type,
    mode: data.type === AiVideoTypeEnum.GENERATE ? data.mode : undefined,
    modelId: data.modelId!,
    prompt: data.type === AiVideoTypeEnum.MOTION ? undefined : data.prompt,
    resolution: data.resolution,
    ratio: data.ratio,
    duration: data.duration,
    options: buildOptions(),
    inputUrls: buildInputUrls(),
  })
  return true
}

/** 做同款：带回类型、模型、生成方式、提示词与参数，不带回输入文件，不再可选的参数重置为默认值；返回原模型是否可用 */
function applySame(video: Video) {
  formData.value.type = video.type
  const model = models.value.find(item => item.id === video.modelId)
  if (model) {
    formData.value.modelId = model.id
  } else {
    selectDefaultModel()
    toast.warning('原模型已不可用，已切换为其它模型')
  }
  handleModelChange()
  if (video.mode && capability.value.modes.includes(video.mode)) {
    formData.value.mode = video.mode
  }
  formData.value.prompt = video.prompt || ''
  if (model) {
    formData.value.resolution = video.resolution
    formData.value.ratio = video.ratio
    formData.value.duration = video.duration
    options.value = { ...video.options }
    // 历史记录未传优化提示词时，服务端按开启处理；开关同步显示为开启
    if (capability.value.fields.includes('shotType') && options.value.promptExtend === undefined) {
      options.value.promptExtend = true
    }
  }
  handleModeChange()
  formData.value.inputs = createEmptyInputs()
  return !!model
}

/** 初始化：加载视频模型，选中第一个模型 */
onMounted(async () => {
  try {
    models.value = await getModelSimpleList(AiModelTypeEnum.VIDEO)
    selectDefaultModel()
  } finally {
    modelsLoaded.value = true
  }
})

defineExpose({ submit, applySame })
</script>
