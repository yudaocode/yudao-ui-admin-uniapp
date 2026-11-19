<template>
  <!-- 旁白：上传音频，或使用语音模型生成；有角色时为样音，这里没有角色，生成的是旁白 -->
  <view class="mt-12rpx rounded-12rpx bg-[#f8f8f8] p-16rpx">
    <wd-radio-group v-model="mode" type="button">
      <wd-radio value="upload">
        上传
      </wd-radio>
      <wd-radio value="generate">
        语音生成
      </wd-radio>
    </wd-radio-group>

    <!-- 上传旁白 -->
    <view v-if="mode === 'upload'" class="mt-16rpx">
      <yd-upload-file
        v-model="uploadUrl"
        :limit="1"
        :file-size="20"
        :file-type="['mp3', 'wav', 'm4a']"
        directory="ai/drama"
      />
      <view class="mt-12rpx">
        <wd-button size="small" type="primary" :disabled="!uploadUrl" :loading="saving" @click="handleUpload">
          保存上传的旁白
        </wd-button>
      </view>
    </view>

    <!-- 语音模型生成旁白 -->
    <view v-else class="mt-16rpx">
      <wd-form :model="formData">
        <wd-cell-group border>
          <yd-form-picker
            v-model="formData.modelId"
            label="语音模型"
            label-width="160rpx"
            placeholder="请选择语音模型"
            :columns="toModelColumns(models)"
            filterable
          />
          <wd-form-item title="音色" title-width="160rpx">
            <wd-input v-model="formData.voice" :maxlength="128" clearable placeholder="服务商的音色标识，例如 longxiaochun" />
          </wd-form-item>
          <wd-form-item title="语速" title-width="160rpx" center>
            <wd-input-number v-model="formData.speed" :min="0.5" :max="2" :step="0.1" :precision="1" />
          </wd-form-item>
          <wd-form-item title="文本" title-width="160rpx" layout="vertical">
            <wd-textarea v-model="formData.text" :maxlength="2000" show-word-limit auto-height placeholder="请输入旁白文本" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-12rpx text-22rpx text-[#999]">
        同步合成，可能需要十几秒
      </view>
      <view class="mt-12rpx">
        <wd-button size="small" type="primary" :disabled="!canGenerate" :loading="generating" @click="handleGenerate">
          生成旁白
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AiModel } from '@/api/ai/model/model'
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createDramaAudio, generateDramaAudio } from '@/api/ai/drama/asset'
import { getModelSimpleList } from '@/api/ai/model/model'
import { AiDramaAudioTypeEnum, AiModelTypeEnum } from '@/utils/constants'
import { toModelColumns } from './use-drama-models'

const props = defineProps<{
  detail: DramaProjectDetail // 项目详情
}>()

const emit = defineEmits<{
  success: [] // 已新增旁白，需要刷新详情
}>()

const toast = useToast()
const mode = ref('upload') // 方式：upload 上传、generate 语音生成
const uploadUrl = ref('') // 待保存的上传旁白
const saving = ref(false) // 保存上传状态
const generating = ref(false) // 生成状态
const models = ref<AiModel[]>([]) // 语音模型
const formData = ref({ // 生成表单；文本默认取剧情大纲
  modelId: undefined as number | undefined,
  voice: '',
  speed: 1,
  text: props.detail.script?.outline?.slice(0, 2000) || '',
})
const canGenerate = computed(() => !!formData.value.modelId && !!formData.value.voice.trim() && !!formData.value.text.trim()) // 模型、音色、文本都已填写

/** 保存上传的旁白 */
async function handleUpload() {
  saving.value = true
  try {
    await createDramaAudio({
      projectId: props.detail.project.id,
      type: AiDramaAudioTypeEnum.NARRATION,
      fileUrl: uploadUrl.value,
    })
    uploadUrl.value = ''
    toast.success('旁白已保存')
    emit('success')
  } finally {
    saving.value = false
  }
}

/** 生成旁白：同步合成，可能需要十几秒 */
async function handleGenerate() {
  generating.value = true
  try {
    await generateDramaAudio({
      projectId: props.detail.project.id,
      modelId: formData.value.modelId!,
      speed: formData.value.speed,
      voice: formData.value.voice.trim(),
      text: formData.value.text.trim(),
    })
    toast.success('生成成功')
    emit('success')
  } finally {
    generating.value = false
  }
}

/** 初始化：加载语音模型，默认选第一个 */
onMounted(async () => {
  models.value = await getModelSimpleList(AiModelTypeEnum.VOICE)
  formData.value.modelId = models.value[0]?.id
})
</script>
