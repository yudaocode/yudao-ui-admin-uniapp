<!-- TODO @AI：可以挪到 /Users/yunai/Java/yudao-ui-admin-uniapp-next-v4/src/pages-im/home/components 里么？ -->
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
    v-else-if="type === ImMessageType.VOICE && audioPayload"
    class="min-w-160rpx flex items-center gap-14rpx"
    @click="playVoice"
  >
    <wd-icon :name="voicePlaying ? 'sound-fill' : 'sound'" size="38rpx" custom-class="text-[#576b95]" />
    <text>{{ audioPayload.duration || 0 }}″</text>
  </view>
  <!-- 视频 -->
  <video
    v-else-if="type === ImMessageType.VIDEO && videoPayload?.url"
    :src="videoPayload.url"
    :poster="videoPayload.coverUrl"
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
import type {
  AudioMessage,
  CardMessage,
  FaceMessage,
  FileMessage,
  MaterialMessage,
  MentionCandidate,
  MergeMessage,
  TipSegment,
  VideoMessage,
} from '@/pages-im/utils/message'
import { computed, onUnmounted } from 'vue'
import { ImConversationType, ImMessageType } from '@/pages-im/utils/constants'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { getImageUrl } from '@/pages-im/utils/image'
import { parseMessage, parseTextSegments } from '@/pages-im/utils/message'
import { openAttachment } from '@/utils/download'
import { openUrl } from '@/utils/url'
import { MESSAGE_MERGE_PREVIEW_LINES } from '@/pages-im/utils/config'
import { useVoicePlayer } from '@/pages-im/home/composables/useVoicePlayer'

const props = defineProps<{
  type?: number // 消息类型 ImMessageType
  content: string // 消息内容（JSON 字符串）
  mentions?: MentionCandidate[] // 文本中的 @ 候选
}>()

const emit = defineEmits<{
  'material-click': [payload: MaterialMessage] // 点击频道素材
  'merge-click': [payload: MergeMessage] // 点击合并转发
  'card-click': [payload: CardMessage] // 点击名片
  'mention-click': [userId: number] // 点击 @ 用户
}>()

const imageUrl = computed(() => getImageUrl(props.content)) // 图片地址
const faceUrl = computed(() => parseMessage<FaceMessage>(props.content)?.url || '') // 表情地址
const filePayload = computed(() => parseMessage<FileMessage>(props.content)) // 文件内容
const audioPayload = computed(() => parseMessage<AudioMessage>(props.content)) // 语音内容
const videoPayload = computed(() => parseMessage<VideoMessage>(props.content)) // 视频内容
const materialPayload = computed(() => parseMessage<MaterialMessage>(props.content)) // 频道素材内容
const cardPayload = computed(() => parseMessage<CardMessage>(props.content)) // 名片内容
const mergePayload = computed(() => parseMessage<MergeMessage>(props.content)) // 合并转发内容
const summary = computed(() => getMessageSummary(props.type, props.content)) // 文本/兜底摘要

/** 合并转发预览 */
const mergePreview = computed(() =>
  (mergePayload.value?.messages || [])
    .slice(0, MESSAGE_MERGE_PREVIEW_LINES)
    .map(item => `${item.senderNickname || ''}：${getMessageSummary(item.type, item.content)}`),
)

/** 文本分段：@ 与链接高亮 */
const textSegments = computed(() => parseTextSegments(summary.value, props.mentions)) // 文本中的 @ 和链接分段
const voiceKey = Symbol('im-voice')
const voicePlayer = useVoicePlayer()
const voicePlaying = computed(() => voicePlayer.isPlaying(voiceKey)) // 当前语音是否播放中

/** 点击文本分段 */
function onSegmentTap(seg: TipSegment) {
  if (seg.type === 'link') {
    openUrl(seg.href)
  } else if (seg.type === 'mention') {
    emit('mention-click', seg.userId)
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
// TODO @AI：使用 wt-image 简化掉？
function previewFace() {
  if (faceUrl.value) {
    uni.previewImage({ urls: [faceUrl.value], current: faceUrl.value })
  }
}

/** 打开文件 */
// TODO @AI：全局有可替代的方法么？
function handleFile() {
  if (filePayload.value?.url) {
    openAttachment(filePayload.value.url)
  }
}

/** 播放/停止语音 */
function playVoice() {
  const url = audioPayload.value?.url
  voicePlayer.play(voiceKey, url || '')
}

/** 卸载时停止当前实例 */
onUnmounted(() => {
  voicePlayer.stop(voiceKey)
})

// TODO @AI：全局有可替代的方法么？
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
