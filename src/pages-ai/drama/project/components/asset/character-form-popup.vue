<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="height: 92vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="h-full flex flex-col">
      <!-- 标题 -->
      <view class="flex items-center justify-between px-24rpx py-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">
          {{ characterId ? `角色：${character?.name || ''}` : '新增角色' }}
        </text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>

      <scroll-view scroll-y class="min-h-0 flex-1">
        <!-- 基本信息 -->
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="角色名称" title-width="180rpx" prop="name">
              <wd-input v-model="formData.name" :maxlength="64" clearable placeholder="请输入角色名称" />
            </wd-form-item>
            <wd-form-item title="别名" title-width="180rpx">
              <wd-input v-model="formData.aliases" :maxlength="255" clearable placeholder="多个用逗号分隔" />
            </wd-form-item>
            <yd-form-picker
              v-model="formData.roleLevel"
              label="角色等级"
              label-width="180rpx"
              :dict-type="DICT_TYPE.AI_DRAMA_CHARACTER_ROLE_LEVEL"
              dict-kind="str"
              clearable
            />
            <yd-form-picker
              v-model="formData.sex"
              label="性别"
              label-width="180rpx"
              :dict-type="DICT_TYPE.SYSTEM_USER_SEX"
              clearable
            />
            <wd-form-item title="年龄段" title-width="180rpx">
              <wd-input v-model="formData.ageRange" :maxlength="32" clearable placeholder="例如：25-30 岁" />
            </wd-form-item>
            <yd-form-picker
              v-model="formData.costumeTier"
              label="服装档次"
              label-width="180rpx"
              :dict-type="DICT_TYPE.AI_DRAMA_CHARACTER_COSTUME_TIER"
              clearable
            />
            <wd-form-item title="性格标签" title-width="180rpx">
              <wd-input v-model="tagsText" clearable placeholder="多个用逗号分隔" />
            </wd-form-item>
            <wd-form-item title="角色设定" title-width="180rpx" layout="vertical">
              <wd-textarea
                v-model="formData.description"
                :maxlength="2000"
                show-word-limit
                auto-height
                placeholder="年龄、外貌、性格、服装"
              />
            </wd-form-item>
            <wd-form-item title="出图提示词" title-width="180rpx" layout="vertical">
              <wd-textarea
                v-model="formData.prompt"
                :maxlength="2000"
                show-word-limit
                auto-height
                placeholder="为空时使用角色设定"
              />
            </wd-form-item>
            <wd-form-item title="参考图" title-width="180rpx">
              <yd-upload-img v-model="formData.referenceImageUrl" :file-size="10" />
            </wd-form-item>
            <wd-form-item title="声音描述" title-width="180rpx">
              <wd-input v-model="formData.voiceDescription" :maxlength="500" clearable placeholder="例如：低沉、沙哑的中年男声" />
            </wd-form-item>
            <wd-form-item title="样音文本" title-width="180rpx">
              <wd-input v-model="formData.sampleText" :maxlength="500" clearable placeholder="生成样音时朗读的文本" />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="bg-white p-24rpx">
          <wd-button block type="primary" :loading="saving" @click="handleSave">
            保存
          </wd-button>
        </view>

        <template v-if="character">
          <!-- 形象版本 -->
          <view class="px-24rpx pb-12rpx pt-32rpx text-28rpx text-[#333] font-semibold">
            形象版本
          </view>
          <view
            v-for="appearance in character.appearances"
            :key="appearance.id"
            class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-20rpx"
          >
            <view class="mb-12rpx flex flex-wrap items-center justify-between gap-8rpx">
              <text class="text-28rpx text-[#333] font-semibold">形象 {{ appearance.appearanceIndex }}</text>
              <view class="flex flex-wrap items-center">
                <wd-button
                  size="small"
                  variant="text"
                  type="primary"
                  :disabled="!imageModelId || isAiDramaRunning(appearance.status)"
                  @click="handleGenerateImage(appearance.id)"
                >
                  {{ getGenerateText(appearance) }}
                </wd-button>
                <wd-button
                  v-if="appearance.previousImageUrls?.length"
                  size="small"
                  variant="text"
                  type="primary"
                  :disabled="isAiDramaRunning(appearance.status)"
                  @click="handleUndoImage(appearance.id)"
                >
                  撤销
                </wd-button>
                <wd-button size="small" variant="text" type="primary" @click="handleSaveAppearance(appearance)">
                  保存设定
                </wd-button>
                <wd-button size="small" variant="text" type="danger" @click="handleDeleteAppearance(appearance.id)">
                  删除
                </wd-button>
              </view>
            </view>
            <wd-input
              v-if="appearance.appearanceIndex > 0 && appearanceForms[appearance.id]"
              v-model="appearanceForms[appearance.id].changeReason"
              :maxlength="255"
              clearable
              placeholder="形象变化原因，例如：落水后换装"
            />
            <wd-textarea
              v-if="appearanceForms[appearance.id]"
              v-model="appearanceForms[appearance.id].description"
              :maxlength="2000"
              auto-height
              placeholder="形象设定，例如：雨夜，湿透的风衣"
            />
            <view class="mt-12rpx flex flex-wrap gap-16rpx">
              <view v-for="(url, index) in appearance.imageUrls || []" :key="`${url}${index}`" class="w-150rpx">
                <view :class="appearance.selectedIndex === index ? 'outline outline-4 outline-[#1677ff] rounded-8rpx' : ''">
                  <AssetImage :url="url" size="150rpx" :preview-urls="appearance.imageUrls" />
                </view>
                <view class="mt-4rpx flex items-center justify-between">
                  <text v-if="appearance.selectedIndex === index" class="text-22rpx text-[#1677ff]">已选用</text>
                  <text v-else class="text-22rpx text-[#1677ff]" @click="handleSelectCandidate(appearance, index)">选用</text>
                  <text class="text-22rpx text-[#f5222d]" @click="handleDeleteCandidate(appearance, index)">删除</text>
                </view>
              </view>
              <!-- 生成中、已失败：占位 -->
              <AssetImage
                v-if="isAiDramaRunning(appearance.status) || appearance.status === AiDramaStatusEnum.FAIL"
                :status="appearance.status"
                :error-message="appearance.errorMessage"
                size="150rpx"
              />
              <text v-else-if="!appearance.imageUrls?.length" class="text-24rpx text-[#999]">
                还没有候选图，选择绘画模型后点击「出图」
              </text>
            </view>
          </view>
          <view class="px-24rpx">
            <wd-button block variant="plain" @click="handleCreateAppearance">
              新增形象
            </wd-button>
          </view>

          <!-- 样音 -->
          <view class="px-24rpx pb-12rpx pt-32rpx text-28rpx text-[#333] font-semibold">
            样音
          </view>
          <view class="px-24rpx pb-12rpx text-22rpx text-[#999]">
            选用的样音会作为该角色台词的参考音频，用于支持参考音频的视频模型
          </view>
          <view
            v-for="audio in character.audios"
            :key="audio.id"
            class="mx-24rpx mb-12rpx flex items-center gap-12rpx rounded-12rpx bg-white p-20rpx"
          >
            <view class="min-w-0 flex-1">
              <AudioPlayer :url="audio.fileUrl" :label="audio.name || audio.text || '样音'" />
            </view>
            <text v-if="audio.id === character.sampleAudioId" class="text-24rpx text-[#52c41a]">已选用</text>
            <wd-button v-else size="small" variant="text" type="primary" @click="handleSelectAudio(audio.id)">
              选用
            </wd-button>
            <wd-button size="small" variant="text" type="danger" @click="handleDeleteAudio(audio.id)">
              删除
            </wd-button>
          </view>
          <view v-if="!character.audios.length" class="px-24rpx py-12rpx text-24rpx text-[#999]">
            暂无样音
          </view>

          <!-- 上传样音：App 端暂不支持选择本地音频 -->
          <view class="px-24rpx pt-12rpx">
            <!-- #ifdef H5 || MP-WEIXIN -->
            <wd-button block variant="plain" :loading="uploading" @click="handleChooseAudio">
              上传样音
            </wd-button>
            <view class="mt-8rpx text-22rpx text-[#999]">
              支持 mp3、wav、m4a，大小不超过 {{ MAX_AUDIO_MB }}MB
            </view>
            <!-- #endif -->
            <!-- #ifdef APP-PLUS -->
            <view class="text-22rpx text-[#999]">
              当前平台暂不支持选择本地音频文件，请使用 H5 或微信小程序上传，也可以直接用语音模型合成样音
            </view>
            <!-- #endif -->
          </view>

          <!-- 合成样音 -->
          <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white pb-12rpx">
            <wd-cell-group border>
              <yd-form-picker
                v-model="generateForm.modelId"
                label="语音模型"
                label-width="180rpx"
                placeholder="请选择语音模型"
                :columns="voiceModelList"
                label-key="name"
                value-key="id"
              />
              <wd-form-item title="音色" title-width="180rpx">
                <wd-input
                  v-model="generateForm.voice"
                  :maxlength="128"
                  clearable
                  placeholder="服务商的音色标识，例如 longxiaochun"
                />
              </wd-form-item>
              <wd-form-item title="语速" title-width="180rpx" center>
                <wd-input-number v-model="generateForm.speed" :min="0.5" :max="2" :step="0.1" :precision="1" />
              </wd-form-item>
              <wd-form-item title="文本" title-width="180rpx" layout="vertical">
                <wd-textarea
                  v-model="generateForm.text"
                  :maxlength="2000"
                  show-word-limit
                  auto-height
                  placeholder="合成样音时朗读的文本"
                />
              </wd-form-item>
            </wd-cell-group>
            <view class="px-24rpx pt-16rpx">
              <wd-button block type="primary" :loading="generating" :disabled="!canGenerate" @click="handleGenerateAudio">
                合成样音
              </wd-button>
              <view class="mt-8rpx text-22rpx text-[#999]">
                同步合成，可能需要十几秒
              </view>
            </view>
          </view>
          <view class="h-48rpx" />
        </template>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DramaAppearance, DramaCharacter, DramaCharacterSaveReq } from '@/api/ai/drama/asset'
import type { AiModel } from '@/api/ai/model/model'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, reactive, ref, watch } from 'vue'
import {
  createDramaAppearance,
  createDramaAudio,
  createDramaCharacter,
  deleteDramaAppearance,
  deleteDramaAppearanceCandidate,
  deleteDramaAudio,
  generateDramaAppearanceImage,
  generateDramaAudio,
  selectDramaAudio,
  undoDramaAppearanceImage,
  updateDramaAppearance,
  updateDramaCharacter,
} from '@/api/ai/drama/asset'
import { getModelSimpleList } from '@/api/ai/model/model'
import { AiDramaAudioTypeEnum, AiDramaStatusEnum, AiModelTypeEnum, DICT_TYPE, isAiDramaRunning } from '@/utils/constants'
import { uploadFileFromPath } from '@/utils/uploadFile'
import { createFormSchema } from '@/utils/wot'
import AssetImage from './asset-image.vue'
import AudioPlayer from './audio-player.vue'

const props = defineProps<{
  projectId: number // 项目编号
  characters: DramaCharacter[] // 项目的角色：用于展示编辑中角色的最新形象、样音
  imageModelId?: number // 绘画模型
}>()

const emit = defineEmits<{
  refresh: []
}>()

const toast = useToast()
const dialog = useDialog()
const visible = ref(false) // 弹窗显示状态
const characterId = ref<number>() // 编辑的角色编号：新增保存后也会赋值
const character = computed(() => props.characters.find(item => item.id === characterId.value)) // 编辑的角色
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<Partial<DramaCharacterSaveReq>>({}) // 基本信息表单
const tagsText = ref('') // 性格标签：逗号分隔
const formSchema = createFormSchema({
  name: [{ required: true, message: '角色名称不能为空' }],
})
const saving = ref(false) // 保存状态
const appearanceForms = reactive<Record<number, { description?: string, changeReason?: string }>>({}) // 形象设定的编辑表单：按形象编号，轮询刷新时不覆盖正在编辑的内容
const MAX_AUDIO_MB = 20 // 上传样音大小上限（MB）
const DEFAULT_SAMPLE_TEXT = '你好，很高兴认识你。' // 合成样音的默认文本
const uploading = ref(false) // 样音上传状态
const generating = ref(false) // 样音合成状态
const voiceModelList = ref<AiModel[]>([]) // 语音模型
const generateForm = ref({ // 样音合成表单
  modelId: undefined as number | undefined,
  voice: '',
  speed: 1,
  text: DEFAULT_SAMPLE_TEXT,
})
const canGenerate = computed(() => !!generateForm.value.modelId && !!generateForm.value.voice.trim() && !!generateForm.value.text.trim()) // 模型、音色、文本都填写后才能合成

/** 形象变化时补齐编辑表单 */
watch(
  () => character.value?.appearances,
  (appearances) => {
    appearances?.forEach((item) => {
      if (!appearanceForms[item.id]) {
        appearanceForms[item.id] = { description: item.description, changeReason: item.changeReason }
      }
    })
  },
  { immediate: true },
)

/** 打开：不传编号时为新增 */
function open(id?: number) {
  visible.value = true
  characterId.value = id
  const item = props.characters.find(c => c.id === id)
  formData.value = {
    name: item?.name || '',
    aliases: item?.aliases || '',
    roleLevel: item?.roleLevel,
    sex: item?.sex,
    ageRange: item?.ageRange || '',
    costumeTier: item?.costumeTier,
    description: item?.description || '',
    prompt: item?.prompt || '',
    referenceImageUrl: item?.referenceImageUrl || '',
    voiceDescription: item?.voiceDescription || '',
    sampleText: item?.sampleText || '',
  }
  tagsText.value = (item?.personalityTags || []).join('，')
  generateForm.value.text = item?.sampleText || DEFAULT_SAMPLE_TEXT
  loadVoiceModels()
}

/** 加载语音模型：只加载一次，默认选中第一个 */
async function loadVoiceModels() {
  if (voiceModelList.value.length) {
    return
  }
  voiceModelList.value = await getModelSimpleList(AiModelTypeEnum.VOICE)
  generateForm.value.modelId ??= voiceModelList.value[0]?.id
}

defineExpose({ open })

/** 出图按钮文案 */
function getGenerateText(appearance: DramaAppearance) {
  if (isAiDramaRunning(appearance.status)) {
    return '生成中'
  }
  return appearance.imageUrls?.length ? '重新出图' : '出图'
}

/** 保存角色：新增后弹窗不关闭，继续编辑形象、样音 */
async function handleSave() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  saving.value = true
  try {
    const data = {
      ...formData.value,
      id: characterId.value,
      projectId: props.projectId,
      personalityTags: tagsText.value.split(/[,，、]/).map(item => item.trim()).filter(Boolean),
    } as DramaCharacterSaveReq
    if (data.id) {
      await updateDramaCharacter(data)
    } else {
      characterId.value = await createDramaCharacter(data)
    }
    toast.success('保存成功')
    emit('refresh')
  } finally {
    saving.value = false
  }
}

// ========== 形象 ==========

/** 新增形象 */
async function handleCreateAppearance() {
  await createDramaAppearance({ characterId: characterId.value! })
  emit('refresh')
}

/** 保存形象设定 */
async function handleSaveAppearance(appearance: DramaAppearance) {
  await updateDramaAppearance({ id: appearance.id, characterId: appearance.characterId, ...appearanceForms[appearance.id] })
  toast.success('保存成功')
  emit('refresh')
}

/** 选用候选图 */
async function handleSelectCandidate(appearance: DramaAppearance, index: number) {
  await updateDramaAppearance({
    id: appearance.id,
    characterId: appearance.characterId,
    ...appearanceForms[appearance.id],
    selectedIndex: index,
  })
  emit('refresh')
}

/** 删除一张候选图：删除前的候选图记为上一版，可撤销 */
async function handleDeleteCandidate(appearance: DramaAppearance, index: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '删除这张候选图后，可通过「撤销」恢复，是否继续？' })
  } catch {
    return
  }
  await deleteDramaAppearanceCandidate(appearance.id, index)
  toast.success('删除成功')
  emit('refresh')
}

/** 撤销上次的候选图变更：恢复为上一版候选图 */
async function handleUndoImage(id: number) {
  await undoDramaAppearanceImage(id)
  toast.success('已撤销')
  emit('refresh')
}

/** 出图 */
async function handleGenerateImage(id: number) {
  await generateDramaAppearanceImage({ id, modelId: props.imageModelId! })
  toast.success('已提交出图')
  emit('refresh')
}

/** 删除形象 */
async function handleDeleteAppearance(id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '确认删除该形象吗？' })
  } catch {
    return
  }
  await deleteDramaAppearance(id)
  toast.success('删除成功')
  emit('refresh')
}

// ========== 样音 ==========

/** 选择本地音频：H5 使用 chooseFile，微信小程序使用 chooseMessageFile，App 暂不支持 */
function handleChooseAudio() {
  if (uploading.value) {
    return
  }
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['mp3', 'wav', 'm4a'],
    success: (res) => {
      const file = res.tempFiles[0]
      handleUploadAudio(file.path, file.name, file.size)
    },
  })
  // #endif
  // #ifdef H5
  uni.chooseFile({
    count: 1,
    extension: ['.mp3', '.wav', '.m4a'],
    success: (res) => {
      const file = (res.tempFiles as any[])[0]
      handleUploadAudio(file.path, file.name, file.size)
    },
  })
  // #endif
}

/** 上传样音：先上传到文件服务，再创建角色样音 */
async function handleUploadAudio(filePath: string, name: string, size: number) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext !== 'mp3' && ext !== 'wav' && ext !== 'm4a') {
    toast.error('只支持 mp3、wav、m4a 格式的音频')
    return
  }
  if (size > MAX_AUDIO_MB * 1024 * 1024) {
    toast.error(`音频大小不能超过 ${MAX_AUDIO_MB}MB`)
    return
  }
  uploading.value = true
  toast.loading('音频上传中...')
  try {
    let fileUrl: string
    try {
      fileUrl = await uploadFileFromPath(filePath, 'ai/drama/audio', undefined, name)
    } catch (error: any) {
      // 文件上传不经过统一请求层，需要页面提示失败原因
      toast.error(error?.message || error?.msg || '上传失败')
      return
    }
    await createDramaAudio({
      projectId: props.projectId,
      characterId: characterId.value,
      type: AiDramaAudioTypeEnum.SAMPLE,
      name: name.replace(/\.[^.]+$/, '').slice(0, 128) || undefined,
      fileUrl,
    })
    toast.success('样音上传成功')
    emit('refresh')
  } finally {
    uploading.value = false
  }
}

/** 合成样音：同步调用语音模型，可能需要十几秒 */
async function handleGenerateAudio() {
  generating.value = true
  try {
    await generateDramaAudio({
      ...generateForm.value,
      modelId: generateForm.value.modelId!,
      projectId: props.projectId,
      characterId: characterId.value,
      voice: generateForm.value.voice.trim(),
      text: generateForm.value.text.trim(),
    })
    toast.success('合成成功')
    emit('refresh')
  } finally {
    generating.value = false
  }
}

/** 选用样音 */
async function handleSelectAudio(id: number) {
  await selectDramaAudio(id)
  emit('refresh')
}

/** 删除样音 */
async function handleDeleteAudio(id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '确认删除该样音吗？' })
  } catch {
    return
  }
  await deleteDramaAudio(id)
  toast.success('删除成功')
  emit('refresh')
}
</script>
