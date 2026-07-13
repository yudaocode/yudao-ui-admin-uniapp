<template>
  <!-- 图片 -->
  <wd-img
    v-if="type === ImMessageType.IMAGE && imageUrl"
    :src="imageUrl"
    width="420rpx"
    height="360rpx"
    radius="8rpx"
    mode="aspectFit"
    @click="previewImage"
  />
  <!-- 表情 -->
  <wd-img
    v-else-if="type === ImMessageType.FACE && faceUrl"
    :src="faceUrl"
    width="240rpx"
    height="240rpx"
    mode="aspectFit"
    @click="previewFace"
  />
  <!-- 文件 -->
  <view
    v-else-if="type === ImMessageType.FILE && filePayload"
    class="w-420rpx"
    @click="handleFile"
  >
    <view class="truncate text-30rpx text-[#333] font-semibold">
      {{ filePayload.name || '文件' }}
    </view>
    <view class="mt-8rpx text-24rpx text-[#999]">
      {{ formatFileSize(filePayload.size) }}
    </view>
    <view class="mt-12rpx border-t border-t-[#f2f3f5] pt-10rpx text-22rpx text-[#999]">
      点击查看文件
    </view>
  </view>
  <!-- 语音 -->
  <view
    v-else-if="type === ImMessageType.VOICE && mediaPayload"
    class="min-w-160rpx flex items-center gap-14rpx"
    @click="playVoice"
  >
    <wd-icon :name="voicePlaying ? 'sound-fill' : 'sound'" size="38rpx" custom-class="text-[#576b95]" />
    <text>{{ mediaPayload.duration || 0 }}″</text>
  </view>
  <!-- 视频 -->
  <video
    v-else-if="type === ImMessageType.VIDEO && mediaPayload?.url"
    :src="mediaPayload.url"
    :poster="mediaPayload.coverUrl"
    class="h-320rpx w-460rpx rounded-8rpx bg-black"
    controls
  />
  <!-- 频道素材 -->
  <view
    v-else-if="type === ImMessageType.MATERIAL && materialPayload"
    class="w-460rpx"
    @click="emit('material-click', materialPayload)"
  >
    <wd-img
      v-if="materialPayload.coverUrl"
      :src="materialPayload.coverUrl"
      custom-class="mb-12rpx bg-[#f2f3f5]"
      width="100%"
      height="220rpx"
      radius="8rpx"
      mode="aspectFill"
    />
    <view class="text-30rpx text-[#333] font-semibold leading-40rpx">
      {{ materialPayload.title || '频道消息' }}
    </view>
    <view v-if="materialPayload.summary" class="mt-8rpx text-24rpx text-[#999] leading-34rpx">
      {{ materialPayload.summary }}
    </view>
    <view class="mt-12rpx border-t border-t-[#f2f3f5] pt-10rpx text-22rpx text-[#999]">
      频道素材
    </view>
  </view>
  <!-- 合并转发 -->
  <view
    v-else-if="type === ImMessageType.MERGE && mergePayload"
    class="w-400rpx"
    @click="emit('merge-click', mergePayload)"
  >
    <view class="text-28rpx text-[#333] font-medium">
      {{ mergePayload.title || '聊天记录' }}
    </view>
    <view class="mt-8rpx text-24rpx text-[#999] leading-34rpx">
      <view v-for="(line, i) in mergePreview" :key="i" class="truncate">
        {{ line }}
      </view>
    </view>
    <view class="mt-12rpx border-t border-t-[#f2f3f5] pt-10rpx text-22rpx text-[#999]">
      聊天记录
    </view>
  </view>
  <!-- 名片 -->
  <view v-else-if="type === ImMessageType.CARD && cardPayload" class="w-380rpx" @click="emit('card-click', cardPayload)">
    <view class="flex items-center gap-16rpx">
      <wd-img
        v-if="cardPayload.avatar"
        :src="cardPayload.avatar"
        custom-class="shrink-0 bg-[#f2f3f5]"
        width="80rpx"
        height="80rpx"
        radius="8rpx"
        mode="aspectFill"
      />
      <view
        v-else
        class="h-80rpx w-80rpx flex shrink-0 items-center justify-center rounded-8rpx bg-[#1677ff] text-30rpx text-white"
      >
        {{ (cardPayload.name || '?').charAt(0) }}
      </view>
      <view class="min-w-0 flex-1">
        <view class="truncate text-30rpx text-[#333]">
          {{ cardPayload.name }}
        </view>
        <view class="mt-6rpx text-22rpx text-[#999]">
          {{ cardSubtitle }}
        </view>
      </view>
    </view>
    <view class="mt-12rpx border-t border-t-[#f2f3f5] pt-10rpx text-22rpx text-[#999]">
      {{ cardPayload.targetType === ImConversationType.GROUP ? '群名片' : '个人名片' }}
    </view>
  </view>
  <!-- 文本 / 其它（系统提示等走摘要兜底）：@ 与链接高亮 -->
  <text v-else selectable>
    <text
      v-for="(seg, i) in textSegments"
      :key="i"
      :class="seg.type !== 'text' ? 'text-[#576b95]' : ''"
      @tap="onSegmentTap(seg)"
    >
      {{ seg.text }}
    </text>
  </text>
</template>

<script lang="ts" setup>
import type { ImCardMessage, ImFaceMessage, ImFileMessage, ImMaterialMessage, ImMediaMessage, ImMergeMessage } from '@/pages-im/utils/message'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onUnmounted, ref } from 'vue'
import { ImConversationType, ImMessageType } from '@/utils/constants'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { getImageUrl } from '@/pages-im/utils/image'
import { parseMessage } from '@/pages-im/utils/message'
import { openAttachment } from '@/utils/download'

const props = defineProps<{
  type?: number // 消息类型 ImMessageType
  content: string // 消息内容（JSON 字符串）
}>()

const emit = defineEmits<{
  'material-click': [payload: ImMaterialMessage] // 点击频道素材
  'merge-click': [payload: ImMergeMessage] // 点击合并转发
  'card-click': [payload: ImCardMessage] // 点击名片
}>()
const toast = useToast()

interface TextSegment {
  type: 'text' | 'mention' | 'link' // 段类型
  text: string // 段文本
}

const imageUrl = computed(() => getImageUrl(props.content)) // 图片地址
const faceUrl = computed(() => parseMessage<ImFaceMessage>(props.content)?.url || '') // 表情地址
const filePayload = computed(() => parseMessage<ImFileMessage>(props.content)) // 文件内容
const mediaPayload = computed(() => parseMessage<ImMediaMessage>(props.content)) // 语音/视频内容
const materialPayload = computed(() => parseMessage<ImMaterialMessage>(props.content)) // 频道素材内容
const cardPayload = computed(() => parseMessage<ImCardMessage>(props.content)) // 名片内容
const mergePayload = computed(() => parseMessage<ImMergeMessage>(props.content)) // 合并转发内容
const summary = computed(() => getMessageSummary(props.type, props.content)) // 文本/兜底摘要

/** 合并转发预览（前 4 条） */
const mergePreview = computed(() =>
  (mergePayload.value?.messages || [])
    .slice(0, 4)
    .map(item => `${item.senderNickname || ''}：${getMessageSummary(item.type, item.content)}`),
)

/** 文本分段：@ 与链接高亮 */
const textSegments = computed(() => parseTextSegments(summary.value))

/** 解析文本为段（普通 / @提及 / 链接） */
function parseTextSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  const regex = /(@\S+|https?:\/\/\S+)/g
  let lastIndex = 0
  let match = regex.exec(text)
  while (match) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }
    const token = match[0]
    segments.push({ type: token.startsWith('@') ? 'mention' : 'link', text: token })
    lastIndex = regex.lastIndex
    match = regex.exec(text)
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) })
  }
  return segments
}

/** 点击段：链接复制 */
function onSegmentTap(seg: TextSegment) {
  if (seg.type === 'link') {
    uni.setClipboardData({ data: seg.text, success: () => toast.show('链接已复制') })
  }
}

/** 名片副标题 */
const cardSubtitle = computed(() => {
  const card = cardPayload.value
  if (!card) {
    return ''
  }
  if (card.targetType === ImConversationType.GROUP) {
    return card.memberCount ? `共 ${card.memberCount} 人` : '群聊'
  }
  return '个人名片'
})

/** 预览图片 */
function previewImage() {
  if (imageUrl.value) {
    uni.previewImage({ urls: [imageUrl.value], current: imageUrl.value })
  }
}

/** 预览表情 */
function previewFace() {
  if (faceUrl.value) {
    uni.previewImage({ urls: [faceUrl.value], current: faceUrl.value })
  }
}

/** 打开文件 */
function handleFile() {
  if (filePayload.value?.url) {
    openAttachment(filePayload.value.url)
  }
}

const voicePlaying = ref(false) // 语音播放状态
let audioContext: UniApp.InnerAudioContext | null = null // 当前组件语音播放器引用

/** 播放/停止语音 */
function playVoice() {
  const url = mediaPayload.value?.url
  if (!url) {
    return
  }
  if (!audioContext) {
    audioContext = uni.createInnerAudioContext()
    audioContext.onEnded(() => (voicePlaying.value = false))
    audioContext.onStop(() => (voicePlaying.value = false))
    audioContext.onError(() => (voicePlaying.value = false))
  }
  if (voicePlaying.value) {
    audioContext.stop()
    return
  }
  if (activeVoiceContext && activeVoiceContext !== audioContext) {
    activeVoiceContext.stop()
  }
  audioContext.src = url
  audioContext.play()
  activeVoiceContext = audioContext
  activeVoiceUrl = url
  voicePlaying.value = true
}

/** 卸载时销毁播放器 */
onUnmounted(() => {
  if (activeVoiceContext === audioContext && activeVoiceUrl === mediaPayload.value?.url) {
    activeVoiceContext = null
    activeVoiceUrl = ''
  }
  audioContext?.destroy()
  audioContext = null
})

/** 格式化文件大小 */
function formatFileSize(size?: number) {
  if (!size) {
    return '-'
  }
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
</script>

<script lang="ts">
let activeVoiceContext: UniApp.InnerAudioContext | null = null // 全局正在播放的语音
let activeVoiceUrl = '' // 全局正在播放的语音地址
</script>
