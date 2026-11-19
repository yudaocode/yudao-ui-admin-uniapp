<template>
  <!-- 镜头声音：发言角色可手动指定顺序，预览生成视频时带上的样音、参考音频 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="height: 80vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="h-full flex flex-col">
      <!-- 标题 -->
      <view class="flex items-center justify-between px-24rpx py-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">镜头声音 · #{{ storyboard?.sceneNo ?? '' }}</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>

      <scroll-view scroll-y class="min-h-0 flex-1">
        <view v-if="loading" class="flex justify-center py-60rpx">
          <wd-loading />
        </view>
        <template v-else>
          <!-- 发言角色 -->
          <view class="px-24rpx">
            <text class="text-28rpx text-[#333] font-semibold">发言角色</text>
            <view class="mt-8rpx text-22rpx text-[#999]">
              {{ voice?.explicit ? '当前为手动指定' : '当前按台词自动识别' }}；按顺序对应参考音频的编号
            </view>
            <view v-if="!speakerIds.length" class="py-24rpx text-24rpx text-[#999]">
              未指定，保存后按台词自动识别
            </view>
            <view v-for="(characterId, index) in speakerIds" :key="characterId" class="mt-12rpx flex items-center gap-12rpx rounded-12rpx bg-[#f8f8f8] p-16rpx">
              <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ index + 1 }}. {{ getCharacterName(characterId) }}</text>
              <wd-button size="small" variant="plain" :disabled="index === 0" @click="handleMove(index, -1)">
                上移
              </wd-button>
              <wd-button size="small" variant="plain" :disabled="index === speakerIds.length - 1" @click="handleMove(index, 1)">
                下移
              </wd-button>
              <wd-button size="small" type="danger" variant="plain" @click="speakerIds.splice(index, 1)">
                移除
              </wd-button>
            </view>
            <view class="mt-16rpx">
              <wd-button size="small" variant="plain" :disabled="!addActions.length || speakerIds.length >= MAX_SPEAKERS" @click="addVisible = true">
                添加发言角色
              </wd-button>
            </view>
          </view>

          <!-- 生成视频时使用 -->
          <view class="mt-24rpx px-24rpx pb-24rpx">
            <text class="text-28rpx text-[#333] font-semibold">生成视频时使用</text>
            <view v-if="!voice?.speakers.length && !voice?.referenceAudios.length" class="py-32rpx text-center text-24rpx text-[#999]">
              没有发言角色和参考音频
            </view>
            <view v-for="item in voice?.speakers || []" :key="item.characterId" class="mt-12rpx rounded-12rpx bg-[#f8f8f8] p-16rpx">
              <view class="flex items-center justify-between gap-12rpx">
                <view class="min-w-0 flex-1">
                  <text class="text-28rpx text-[#333] font-semibold">{{ item.name }}</text>
                  <wd-tag v-if="!item.sampleAudioUrl" type="warning" class="ml-8rpx">
                    未选用样音
                  </wd-tag>
                </view>
                <AudioPlayButton v-if="item.sampleAudioUrl" :url="item.sampleAudioUrl" />
              </view>
              <view class="mt-8rpx break-all text-22rpx text-[#999]">
                {{ item.voiceDescription || '未设置声音描述' }}
              </view>
            </view>
            <view v-for="item in voice?.referenceAudios || []" :key="item.url" class="mt-12rpx flex items-center justify-between gap-12rpx rounded-12rpx bg-[#f8f8f8] p-16rpx">
              <text class="min-w-0 flex-1 break-all text-24rpx text-[#333]">{{ item.description }}</text>
              <AudioPlayButton :url="item.url" />
            </view>
            <view class="mt-16rpx text-22rpx text-[#999]">
              声音描述作为文字写入视频提示词（当前语音合成只支持选择音色，不支持按描述设计音色）；参考音频只在不使用起始帧、且视频模型支持参考生视频时提交，模型不支持时自动去掉
            </view>
          </view>
        </template>
      </scroll-view>

      <!-- 底部操作 -->
      <view class="flex gap-24rpx bg-white p-24rpx">
        <wd-button class="flex-1" variant="plain" :disabled="loading" :loading="saving" @click="handleAuto">
          恢复自动识别
        </wd-button>
        <wd-button class="flex-1" type="primary" :disabled="loading" :loading="saving" @click="handleSave">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <!-- 添加发言角色 -->
  <wd-action-sheet
    v-model="addVisible"
    :actions="addActions"
    title="添加发言角色"
    cancel-text="取消"
    root-portal
    @select="handleAdd"
  />
</template>

<script lang="ts" setup>
import type { DramaCharacter } from '@/api/ai/drama/asset'
import type { DramaStoryboard, DramaStoryboardVoice } from '@/api/ai/drama/storyboard'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getDramaStoryboardVoice, updateDramaStoryboardSpeakers } from '@/api/ai/drama/storyboard'
import AudioPlayButton from '../../components/storyboard/audio-play-button.vue'

const props = defineProps<{
  characters: DramaCharacter[] // 项目的角色
}>()

const emit = defineEmits<{
  success: [] // 已保存，需要刷新详情
}>()

const MAX_SPEAKERS = 10 // 发言角色上限，与后端一致
const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const addVisible = ref(false) // 添加发言角色菜单
const loading = ref(false) // 加载状态
const saving = ref(false) // 保存状态
const storyboard = ref<DramaStoryboard>() // 当前镜头
const voice = ref<DramaStoryboardVoice>() // 镜头声音预览
const speakerIds = ref<number[]>([]) // 手动指定的发言角色，按顺序

const addActions = computed(() => // 还没有选的角色
  props.characters
    .filter(item => !speakerIds.value.includes(item.id))
    .map(item => ({ name: item.name, value: item.id })),
)

/** 获得角色名 */
function getCharacterName(characterId: number) {
  return props.characters.find(item => item.id === characterId)?.name || `#${characterId}`
}

/** 加载镜头声音：手动指定时回填发言角色 */
async function loadVoice() {
  loading.value = true
  try {
    voice.value = await getDramaStoryboardVoice(storyboard.value!.id)
    speakerIds.value = voice.value.explicit ? voice.value.speakers.map(item => item.characterId) : []
  } finally {
    loading.value = false
  }
}

/** 打开 */
async function open(item: DramaStoryboard) {
  storyboard.value = item
  voice.value = undefined
  speakerIds.value = []
  visible.value = true
  await loadVoice()
}

defineExpose({ open })

/** 调整发言顺序 */
function handleMove(index: number, offset: number) {
  const [item] = speakerIds.value.splice(index, 1)
  speakerIds.value.splice(index + offset, 0, item)
}

/** 添加发言角色 */
function handleAdd({ item }: { item: { value: number } }) {
  speakerIds.value.push(item.value)
}

/** 保存发言角色：为空时按台词自动识别 */
async function save(characterIds?: number[]) {
  saving.value = true
  try {
    await updateDramaStoryboardSpeakers({ id: storyboard.value!.id, characterIds })
    toast.success('已保存')
    emit('success')
    await loadVoice()
  } finally {
    saving.value = false
  }
}

/** 保存 */
function handleSave() {
  return save(speakerIds.value.length ? speakerIds.value : undefined)
}

/** 恢复自动识别 */
function handleAuto() {
  speakerIds.value = []
  return save(undefined)
}
</script>
