<template>
  <!-- AI 配乐：复用 AI 音乐生成，选用已完成的音乐作为配乐 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="h-full flex flex-col">
      <!-- 标题 -->
      <view class="flex items-center justify-between px-24rpx py-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">AI 配乐</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>

      <scroll-view scroll-y class="min-h-0 flex-1">
        <!-- 生成音乐 -->
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <MusicModelFormPicker v-model="formData.modelId" label="音乐模型" label-width="180rpx" prop="modelId" />
            <wd-form-item title="纯音乐" title-width="180rpx" center>
              <wd-switch v-model="formData.makeInstrumental" />
            </wd-form-item>
            <wd-form-item title="音乐描述" title-width="180rpx" prop="prompt" layout="vertical">
              <wd-textarea v-model="formData.prompt" :maxlength="500" show-word-limit auto-height placeholder="请输入音乐描述" />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <wd-button size="small" variant="plain" @click="draftPrompt">
            按剧本起草
          </wd-button>
          <wd-button size="small" type="primary" :loading="generating" @click="handleGenerate">
            生成音乐
          </wd-button>
        </view>

        <!-- 我的 AI 音乐 -->
        <view class="mt-16rpx px-24rpx">
          <text class="text-28rpx text-[#333] font-semibold">我的 AI 音乐</text>
        </view>
        <wd-form :model="formData">
          <wd-cell-group border>
            <yd-form-picker
              v-model="storyboardIds"
              label="使用的镜头"
              label-width="180rpx"
              placeholder="选用时使用的镜头；为空表示候选"
              :columns="storyboardColumns"
              type="checkbox"
              filterable
              clearable
            />
          </wd-cell-group>
        </wd-form>
        <view class="px-24rpx pb-24rpx">
          <view v-if="loading" class="flex justify-center py-40rpx">
            <wd-loading />
          </view>
          <view v-else-if="!list.length" class="py-40rpx text-center text-26rpx text-[#999]">
            暂无 AI 音乐，可先生成
          </view>
          <view v-for="item in list" :key="item.id" class="mt-16rpx rounded-12rpx bg-[#f8f8f8] p-20rpx">
            <view class="flex items-center justify-between gap-12rpx">
              <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ getMusicTitle(item.title) }}</text>
              <dict-tag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="item.status" />
            </view>
            <view v-if="item.status === AiMusicStatusEnum.FAIL && item.errorMessage" class="mt-8rpx break-all text-22rpx text-[#f5222d]">
              {{ item.errorMessage }}
            </view>
            <view class="mt-12rpx flex items-center justify-between gap-12rpx">
              <view class="flex items-center gap-16rpx">
                <AudioPlayButton v-if="item.audioUrl" :url="item.audioUrl" />
                <text v-if="item.duration" class="text-22rpx text-[#999]">{{ formatMusicDuration(item.duration) }}</text>
              </view>
              <wd-button
                size="small"
                type="primary"
                variant="plain"
                :disabled="item.status !== AiMusicStatusEnum.SUCCESS || !item.audioUrl"
                :loading="usingId === item.id"
                @click="handleUse(item)"
              >
                选用
              </wd-button>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import type { Music } from '@/api/ai/music'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onUnmounted, ref, watch } from 'vue'
import { createDramaMusicAudio } from '@/api/ai/drama/asset'
import { generateMusic, getMusicMyPage } from '@/api/ai/music'
import MusicModelFormPicker from '@/pages-ai/music/components/music-model-form-picker.vue'
import { AiMusicGenerateModeEnum, AiMusicStatusEnum, DICT_TYPE, formatMusicDuration, getMusicTitle, isAiMusicRunning } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import AudioPlayButton from './audio-play-button.vue'

const props = defineProps<{
  detail: DramaProjectDetail // 项目详情
}>()

const emit = defineEmits<{
  success: [] // 已加入配乐，需要刷新详情
}>()

const POLL_INTERVAL = 5000 // 音乐生成中的轮询间隔（毫秒）
const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 列表加载状态
const generating = ref(false) // 生成提交状态
const usingId = ref<number>() // 选用中的音乐编号
const formRef = ref<FormInstance>() // 表单组件引用
const list = ref<Music[]>([]) // 我的 AI 音乐
const storyboardIds = ref<number[]>([]) // 选用时使用的镜头
const formData = ref({ // 生成表单
  modelId: undefined as number | undefined,
  prompt: '',
  makeInstrumental: true,
})
const formSchema = createFormSchema({
  modelId: [{ required: true, message: '请选择音乐模型' }],
  prompt: [{ required: true, message: '请输入音乐描述' }],
})
const storyboardColumns = computed(() => // 可使用的镜头
  props.detail.storyboards.map(item => ({ label: `#${item.sceneNo} ${item.title || '未命名镜头'}`, value: item.id })),
)
let timer: ReturnType<typeof setInterval> | undefined // 轮询定时器

/** 加载我的 AI 音乐：轮询刷新时不显示加载状态 */
async function getList() {
  loading.value = list.value.length === 0
  try {
    list.value = (await getMusicMyPage({ pageNo: 1, pageSize: 20 })).list
  } finally {
    loading.value = false
  }
}

/** 按剧本起草：剧名、基调、大纲 */
function draftPrompt() {
  const script = props.detail.script
  formData.value.prompt = [
    `短剧《${script?.title || props.detail.project.name}》的配乐`,
    script?.tone ? `基调：${script.tone}` : '',
    script?.outline ? `剧情：${script.outline.slice(0, 300)}` : '',
  ].filter(Boolean).join('。')
}

/** 打开 */
async function open() {
  storyboardIds.value = []
  visible.value = true
  if (!formData.value.prompt) {
    draftPrompt()
  }
  await getList()
}

defineExpose({ open })

/** 停止轮询 */
function stopPolling() {
  clearInterval(timer)
  timer = undefined
}

/** 有生成中的音乐时轮询 */
watch(() => visible.value && list.value.some(item => isAiMusicRunning(item.status)), (value) => {
  stopPolling()
  if (value) {
    timer = setInterval(getList, POLL_INTERVAL)
  }
})

/** 卸载：停止轮询 */
onUnmounted(stopPolling)

/** 生成音乐 */
async function handleGenerate() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  generating.value = true
  try {
    await generateMusic({
      generateMode: AiMusicGenerateModeEnum.INSPIRATION,
      modelId: formData.value.modelId!,
      prompt: formData.value.prompt,
      makeInstrumental: formData.value.makeInstrumental,
    })
    toast.success('已提交生成，完成后可选用')
    await getList()
  } finally {
    generating.value = false
  }
}

/** 选用为配乐 */
async function handleUse(item: Music) {
  usingId.value = item.id
  try {
    await createDramaMusicAudio({
      projectId: props.detail.project.id,
      musicId: item.id,
      storyboardIds: storyboardIds.value,
    })
    toast.success('已加入配乐，可在配乐列表调整音量与起始偏移')
    emit('success')
  } finally {
    usingId.value = undefined
  }
}
</script>
