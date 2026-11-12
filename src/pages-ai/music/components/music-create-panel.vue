<template>
  <view class="p-24rpx">
    <!-- 续写来源 -->
    <view v-if="extendSource" class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-30rpx text-[#333] font-semibold">续写歌曲</text>
        <view class="flex items-center gap-6rpx text-26rpx text-[#1677ff]" @click="cancelExtend">
          <wd-icon name="close" size="28rpx" color="#1677ff" />
          <text>取消续写</text>
        </view>
      </view>
      <view class="flex items-center gap-20rpx rounded-12rpx bg-[#f8f8f8] p-16rpx">
        <view class="shrink-0">
          <wd-img v-if="extendSource.coverUrl" :src="extendSource.coverUrl" width="88rpx" height="88rpx" radius="8rpx" mode="aspectFill" />
          <view v-else class="h-88rpx w-88rpx flex items-center justify-center rounded-8rpx bg-white">
            <wd-icon name="headset" size="40rpx" color="#bbb" />
          </view>
        </view>
        <view class="min-w-0 flex-1">
          <view class="truncate text-28rpx text-[#333] font-semibold">
            {{ getMusicTitle(extendSource.title) }}
          </view>
          <view class="mt-6rpx text-24rpx text-[#999]">
            {{ extendSource.model }} · 时长 {{ formatMusicDuration(extendSource.duration) }}
          </view>
        </view>
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <template v-if="extendSource">
            <wd-form-item title="续写起点" title-width="170rpx" prop="extendSeconds" center>
              <wd-input-number
                v-model="formData.extendSeconds"
                :min="0"
                :max="extendMaxSeconds"
                :precision="0"
              />
            </wd-form-item>
            <view class="px-32rpx pb-16rpx text-22rpx text-[#999]">
              单位为秒，默认原曲结尾；模型与渠道沿用原曲
            </view>
          </template>
          <template v-else>
            <wd-form-item title="创作模式" title-width="170rpx" prop="generateMode" center>
              <wd-radio-group v-model="formData.generateMode" type="button">
                <wd-radio :value="AiMusicGenerateModeEnum.INSPIRATION">
                  灵感模式
                </wd-radio>
                <wd-radio :value="AiMusicGenerateModeEnum.CUSTOM">
                  自定义模式
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <MusicModelFormPicker v-model="formData.modelId" prop="modelId" />
            <wd-form-item title="纯音乐" title-width="170rpx" prop="makeInstrumental" center>
              <view class="flex items-center gap-12rpx">
                <wd-switch v-model="formData.makeInstrumental" />
                <text class="text-22rpx text-[#999]">开启后生成不带人声的音乐</text>
              </view>
            </wd-form-item>
          </template>

          <!-- 灵感模式：歌曲描述 -->
          <wd-form-item v-if="isInspiration" title="歌曲描述" title-width="170rpx" prop="prompt">
            <wd-textarea
              v-model="formData.prompt"
              placeholder="描述想要的歌曲，例如：一首关于夏日海边的轻快流行歌，女声"
              :maxlength="1024"
              show-word-limit
              clearable
            />
          </wd-form-item>

          <!-- 自定义、续写：歌词、风格、名称 -->
          <template v-else>
            <wd-form-item v-if="!formData.makeInstrumental || extendSource" title="歌词" title-width="170rpx" prop="lyric">
              <wd-textarea
                v-model="formData.lyric"
                :placeholder="extendSource ? '输入续写部分的歌词，可留空' : '输入歌词，或输入一个主题后点「AI 生成歌词」'"
                :maxlength="1024"
                show-word-limit
                clearable
              />
            </wd-form-item>
            <view v-if="!extendSource && !formData.makeInstrumental" class="px-32rpx pb-16rpx">
              <wd-button size="small" variant="plain" :loading="lyricLoading" @click="handleGenerateLyric">
                AI 生成歌词
              </wd-button>
            </view>
            <wd-form-item title="音乐风格" title-width="170rpx" prop="tags">
              <wd-input v-model="formData.tags" :maxlength="120" clearable placeholder="例如：pop, female vocals" />
            </wd-form-item>
            <view class="flex flex-wrap gap-12rpx px-32rpx pb-20rpx">
              <wd-tag
                v-for="tag in AI_MUSIC_PRESET_TAGS"
                :key="tag.value"
                :type="hasTag(tag.value) ? 'primary' : 'default'"
                :variant="hasTag(tag.value) ? 'dark' : 'plain'"
                @click="handleTagClick(tag.value)"
              >
                {{ tag.label }}
              </wd-tag>
            </view>
            <wd-form-item title="歌曲名称" title-width="170rpx" prop="title">
              <wd-input v-model="formData.title" :maxlength="100" clearable placeholder="请输入歌曲名称" />
            </wd-form-item>
          </template>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 提交按钮 -->
    <view class="mt-24rpx">
      <wd-button block type="primary" :loading="submitting" @click="handleSubmit">
        {{ extendSource ? '续写歌曲' : '开始创作' }}
      </wd-button>
    </view>

    <!-- 上传音频：App 端暂不支持选择本地音频 -->
    <!-- #ifdef H5 || MP-WEIXIN -->
    <view v-if="!extendSource" class="mt-24rpx">
      <wd-divider>或</wd-divider>
      <wd-button block variant="plain" :loading="uploading" @click="handleChooseAudio">
        上传音乐
      </wd-button>
      <view class="mt-12rpx text-22rpx text-[#999] leading-36rpx">
        支持 mp3 / wav；中转通常要求时长 6–60 秒、不含受版权保护的人声。上传完成后可作为续写来源。需中转支持 /suno/uploads/audio-url 扩展路径（官方 SunoAPI 插件不支持）。
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Music } from '@/api/ai/music'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { extendMusic, generateLyric, generateMusic, uploadMusic } from '@/api/ai/music'
import { AI_MUSIC_PRESET_TAGS, AiMusicGenerateModeEnum, formatMusicDuration, getMusicTitle } from '@/utils/constants'
import { uploadFileFromPath } from '@/utils/uploadFile'
import { createFormSchema } from '@/utils/wot'
import MusicModelFormPicker from './music-model-form-picker.vue'

const emit = defineEmits<{
  submitted: [] // 提交成功，用于刷新作品列表
}>()

const toast = useToast()
const maxUploadMb = 50 // 上传音频大小上限（MB）
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref({
  generateMode: AiMusicGenerateModeEnum.INSPIRATION as number,
  modelId: undefined as number | undefined,
  makeInstrumental: false,
  prompt: '',
  lyric: '',
  tags: '',
  title: '',
  extendSeconds: 0,
}) // 表单数据
const extendSource = ref<Music>() // 续写来源；为空表示普通创作
const submitting = ref(false) // 提交状态
const lyricLoading = ref(false) // 歌词生成状态
const uploading = ref(false) // 音频上传状态
const isInspiration = computed(() => !extendSource.value && formData.value.generateMode === AiMusicGenerateModeEnum.INSPIRATION) // 是否灵感模式
const extendMaxSeconds = computed(() => { // 续写起点上限：不超过原曲时长
  const duration = extendSource.value?.duration
  return duration !== undefined && duration !== null ? Math.floor(duration) : Number.MAX_SAFE_INTEGER
})
const formSchema = createFormSchema(() => {
  if (extendSource.value) {
    return {
      extendSeconds: [
        { required: true, message: '请输入续写起点' },
        { max: extendMaxSeconds.value, message: '续写起点不能超过原曲时长' },
      ],
      title: [{ required: true, message: '请输入歌曲名称' }],
    }
  }
  if (isInspiration.value) {
    return {
      modelId: [{ required: true, message: '请选择模型' }],
      prompt: [{ required: true, message: '请输入歌曲描述' }],
    }
  }
  return {
    modelId: [{ required: true, message: '请选择模型' }],
    lyric: [{ required: () => !formData.value.makeInstrumental, message: '请输入歌词' }],
    title: [{ required: true, message: '请输入歌曲名称' }],
  }
})

/** 拆分音乐风格 */
function splitTags() {
  return formData.value.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean)
}

/** 是否已选择风格 */
function hasTag(value: string) {
  return splitTags().includes(value)
}

/** 点选预置风格：追加或移除 */
function handleTagClick(value: string) {
  const tags = splitTags()
  const index = tags.indexOf(value)
  if (index >= 0) {
    tags.splice(index, 1)
  } else {
    tags.push(value)
  }
  const joined = tags.join(', ')
  if (joined.length > 120) {
    toast.warning('音乐风格不能超过 120 个字符')
    return
  }
  formData.value.tags = joined
}

/** AI 生成歌词：歌词框内容作为主题，返回的第一行作为名称 */
async function handleGenerateLyric() {
  const prompt = formData.value.lyric.trim()
  if (!prompt) {
    toast.warning('请先在歌词框输入歌词主题')
    return
  }
  lyricLoading.value = true
  try {
    const data = await generateLyric(prompt)
    formData.value.lyric = (data.lyric || '').slice(0, 1024)
    if (data.title) {
      formData.value.title = data.title.slice(0, 100)
    }
    toast.success('歌词生成成功')
  } finally {
    lyricLoading.value = false
  }
}

/** 提交创作或续写 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  submitting.value = true
  try {
    const data = formData.value
    if (extendSource.value) {
      await extendMusic({
        id: extendSource.value.id,
        extendSeconds: data.extendSeconds,
        lyric: data.lyric || undefined,
        tags: data.tags || undefined,
        title: data.title,
      })
      toast.success('续写任务已提交')
      cancelExtend()
    } else if (isInspiration.value) {
      await generateMusic({
        generateMode: AiMusicGenerateModeEnum.INSPIRATION,
        modelId: data.modelId!,
        prompt: data.prompt,
        makeInstrumental: data.makeInstrumental,
      })
      toast.success('创作任务已提交')
    } else {
      await generateMusic({
        generateMode: AiMusicGenerateModeEnum.CUSTOM,
        modelId: data.modelId!,
        lyric: data.makeInstrumental ? undefined : data.lyric,
        tags: data.tags || undefined,
        title: data.title,
        makeInstrumental: data.makeInstrumental,
      })
      toast.success('创作任务已提交')
    }
    emit('submitted')
  } finally {
    submitting.value = false
  }
}

/** 设置续写来源：起点默认原曲时长，名称、风格沿用原曲 */
function setExtendSource(music: Music) {
  extendSource.value = music
  formData.value.extendSeconds = music.duration !== undefined && music.duration !== null ? Math.floor(music.duration) : 0
  formData.value.lyric = ''
  formData.value.tags = music.tags ? music.tags.slice(0, 120) : ''
  formData.value.title = getMusicTitle(music.title).slice(0, 100)
  formRef.value?.reset()
}

/** 取消续写，回到普通创作 */
function cancelExtend() {
  extendSource.value = undefined
  formData.value.extendSeconds = 0
  formRef.value?.reset()
}

/** 选择本地音频：H5 使用 chooseFile，微信小程序使用 chooseMessageFile */
function handleChooseAudio() {
  if (uploading.value) {
    return
  }
  if (!formData.value.modelId) {
    toast.warning('请先选择模型')
    return
  }
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['mp3', 'wav'],
    success: (res) => {
      const file = res.tempFiles[0]
      handleUpload(file.path, file.name, file.size)
    },
  })
  // #endif
  // #ifdef H5
  uni.chooseFile({
    count: 1,
    extension: ['.mp3', '.wav'],
    success: (res) => {
      const file = (res.tempFiles as any[])[0]
      handleUpload(file.path, file.name, file.size)
    },
  })
  // #endif
}

/** 上传音频：先上传到文件服务，再提交上传任务 */
async function handleUpload(filePath: string, name: string, size: number) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext !== 'mp3' && ext !== 'wav') {
    toast.error('只支持 mp3、wav 格式的音频')
    return
  }
  if (size > maxUploadMb * 1024 * 1024) {
    toast.error(`音频大小不能超过 ${maxUploadMb}MB`)
    return
  }
  const title = name.replace(/\.[^.]+$/, '').slice(0, 100)
  uploading.value = true
  toast.loading('音频上传中...')
  try {
    const fileUrl = await uploadFileFromPath(filePath, 'ai/music', undefined, name)
    await uploadMusic({
      modelId: formData.value.modelId!,
      fileUrl,
      title: title || undefined,
    })
    toast.success('歌曲上传成功，正在处理')
    emit('submitted')
  } catch (error: any) {
    // 文件上传不经过统一请求层，需要页面提示失败原因
    toast.error(error?.message || error?.msg || '上传失败')
  } finally {
    uploading.value = false
  }
}

defineExpose({ setExtendSource })
</script>
