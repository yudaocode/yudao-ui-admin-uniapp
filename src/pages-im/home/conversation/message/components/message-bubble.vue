<template>
  <view
    class="im-message-bubble"
    :class="[
      centered ? 'im-message-bubble--centered' : selfSend ? 'im-message-bubble--self' : 'im-message-bubble--other',
      plain ? 'im-message-bubble--plain' : '',
      embedded ? 'im-message-bubble--embedded' : '',
    ]"
  >
    <!-- 图片 -->
    <view v-if="type === ImMessageType.IMAGE && imageUrl" class="relative overflow-hidden rounded-8rpx" @click="previewImage">
      <wd-img :src="imageUrl" width="420rpx" height="360rpx" radius="8rpx" mode="aspectFit" />
      <view v-if="isUploading" class="absolute inset-0 flex items-center justify-center bg-black/45 text-28rpx text-white">
        {{ normalizedUploadProgress }}%
      </view>
    </view>
    <!-- 表情 -->
    <wd-img
      v-else-if="type === ImMessageType.FACE && faceUrl"
      :src="faceUrl"
      width="240rpx"
      height="240rpx"
      mode="aspectFit"
      enable-preview
    />
    <!-- 文件 -->
    <view v-else-if="type === ImMessageType.FILE && filePayload" class="w-420rpx" @click="handleFile">
      <view class="truncate text-30rpx text-[#333] font-semibold">
        {{ filePayload.name || '文件' }}
      </view>
      <view class="mt-8rpx text-24rpx text-[#999]">
        {{ formatFileSize(filePayload.size) }}
      </view>
      <view v-if="isUploading" class="mt-12rpx">
        <view class="h-6rpx overflow-hidden rounded-full bg-[#e5e6eb]">
          <view class="h-full bg-[#07c160]" :style="{ width: `${normalizedUploadProgress}%` }" />
        </view>
        <view class="mt-6rpx text-22rpx text-[#999]">
          上传中 {{ normalizedUploadProgress }}%
        </view>
      </view>
      <view class="mt-12rpx border-t border-t-[#f2f3f5] pt-10rpx text-22rpx text-[#999]">
        {{ filePayload.url ? '点击查看文件' : '上传失败，请重新选择文件' }}
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
    <view v-else-if="type === ImMessageType.VIDEO && videoPayload?.url" class="relative overflow-hidden rounded-8rpx">
      <video
        :src="videoPayload.url"
        :poster="videoPayload.coverUrl"
        class="h-320rpx w-460rpx bg-black"
        :controls="!isUploading"
      />
      <view v-if="isUploading" class="absolute inset-0 flex items-center justify-center bg-black/45 text-28rpx text-white">
        {{ normalizedUploadProgress }}%
      </view>
    </view>
    <!-- 频道素材 -->
    <MaterialBubble
      v-else-if="type === ImMessageType.MATERIAL && materialPayload"
      :material="materialPayload"
      :conversation-type="conversationType"
      @click="emit('material-click', $event)"
    />
    <!-- 合并转发 -->
    <view v-else-if="type === ImMessageType.MERGE && mergePayload" class="w-400rpx" @click="emit('open-merge', content)">
      <view class="text-28rpx text-[#333] font-medium">
        {{ mergePayload.title || '聊天记录' }}
      </view>
      <view class="mt-8rpx text-24rpx text-[#999] leading-34rpx">
        <view v-for="(line, index) in mergePreview" :key="index" class="truncate">
          {{ line }}
        </view>
      </view>
      <view class="mt-12rpx border-t border-t-[#f2f3f5] pt-10rpx text-22rpx text-[#999]">
        聊天记录
      </view>
    </view>
    <!-- 名片 -->
    <CardBubble
      v-else-if="type === ImMessageType.CARD && cardPayload"
      :card="cardPayload"
      @click="emit('click-card', cardPayload)"
    />
    <!-- 文本：@ 与链接高亮 -->
    <MessageTipSegments
      v-else-if="type === ImMessageType.TEXT"
      :segments="textSegments"
      selectable
      @mention-click="emit('mention-click', $event)"
    />
    <!-- 未知消息类型 -->
    <text v-else class="text-24rpx text-[#999]">{{ summary || '[不支持的内容类型]' }}</text>
  </view>
</template>

<script lang="ts" setup>
import type {
  AudioMessage,
  CardMessage,
  FaceMessage,
  FileMessage,
  ImageMessage,
  MaterialMessage,
  MentionCandidate,
  MergeMessage,
  VideoMessage,
} from '@/pages-im/utils/message'
import { computed, onUnmounted } from 'vue'
import { ImMessageType } from '@/pages-im/utils/constants'
import { MESSAGE_MERGE_PREVIEW_LINES } from '@/pages-im/utils/config'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { getImageUrl } from '@/pages-im/utils/image'
import { parseMessage, parseTextSegments } from '@/pages-im/utils/message'
import { formatFileSize, openAttachment } from '@/utils/download'
import CardBubble from '@/pages-im/home/components/card/card-bubble.vue'
import { useVoicePlayer } from '@/pages-im/home/composables/useVoicePlayer'
import MaterialBubble from './material-bubble.vue'
import MessageTipSegments from './message-tip-segments.vue'

const props = defineProps<{
  type: number // 消息类型 ImMessageType
  content: string // 消息内容（JSON 字符串）
  selfSend?: boolean // 是否自己发送
  conversationType?: number // 当前会话类型
  mentions?: MentionCandidate[] // 文本中的 @ 候选
  uploadProgress?: number | null // 媒体上传进度
  embedded?: boolean // 是否嵌入外部气泡容器
  centered?: boolean // 是否使用居中无箭头卡片样式
}>()

const emit = defineEmits<{
  'material-click': [payload: MaterialMessage] // 点击频道素材
  'open-merge': [content: string] // 点击合并转发
  'click-card': [payload: CardMessage] // 点击名片
  'mention-click': [userId: number] // 点击 @ 用户
}>()

const parsedContent = computed(() => parseMessage<unknown>(props.content)) // 统一解析后的消息内容
const imagePayload = computed(() => props.type === ImMessageType.IMAGE ? parsedContent.value as ImageMessage | null : null) // 图片内容
const imageUrl = computed(() => getImageUrl(imagePayload.value)) // 图片展示地址
const imageOriginalUrl = computed(() => imagePayload.value?.url || '') // 图片原图地址
const faceUrl = computed(() => props.type === ImMessageType.FACE ? (parsedContent.value as FaceMessage | null)?.url || '' : '') // 表情地址
const filePayload = computed(() => props.type === ImMessageType.FILE ? parsedContent.value as FileMessage | null : null) // 文件内容
const audioPayload = computed(() => props.type === ImMessageType.VOICE ? parsedContent.value as AudioMessage | null : null) // 语音内容
const videoPayload = computed(() => props.type === ImMessageType.VIDEO ? parsedContent.value as VideoMessage | null : null) // 视频内容
const materialPayload = computed(() => props.type === ImMessageType.MATERIAL ? parsedContent.value as MaterialMessage | null : null) // 素材内容
const cardPayload = computed(() => props.type === ImMessageType.CARD ? parsedContent.value as CardMessage | null : null) // 名片内容
const mergePayload = computed(() => props.type === ImMessageType.MERGE ? parsedContent.value as MergeMessage | null : null) // 合并转发内容
const summary = computed(() => getMessageSummary(props.type, props.content)) // 文本/兜底摘要
const isUploading = computed(() => props.uploadProgress != null) // 是否正在上传媒体
const normalizedUploadProgress = computed(() => Math.min(100, Math.max(0, Math.round(props.uploadProgress || 0)))) // 上传进度
const plainTypes: number[] = [ImMessageType.IMAGE, ImMessageType.FACE, ImMessageType.VIDEO] // 媒体直显消息类型
const plain = computed(() => plainTypes.includes(props.type)) // 是否媒体直显消息
const mergePreview = computed(() => (mergePayload.value?.messages || [])
  .slice(0, MESSAGE_MERGE_PREVIEW_LINES)
  .map(item => `${item.senderNickname || ''}：${getMessageSummary(item.type, item.content)}`)) // 合并转发预览
const textSegments = computed(() => parseTextSegments(summary.value, props.mentions)) // 文本中的 @ 和链接分段
const voiceKey = Symbol('im-voice')
const voicePlayer = useVoicePlayer()
const voicePlaying = computed(() => voicePlayer.isPlaying(voiceKey)) // 当前语音是否播放中

/** 打开文件 */
function handleFile() {
  if (!isUploading.value && filePayload.value?.url) {
    openAttachment(filePayload.value.url)
  }
}

/** 预览图片原图 */
function previewImage() {
  if (!isUploading.value && imageOriginalUrl.value) {
    uni.previewImage({ current: imageOriginalUrl.value, urls: [imageOriginalUrl.value] })
  }
}

/** 播放/停止语音 */
function playVoice() {
  voicePlayer.play(voiceKey, audioPayload.value?.url || '')
}

/** 卸载时停止当前实例 */
onUnmounted(() => voicePlayer.stop(voiceKey))
</script>

<style lang="scss" scoped>
.im-message-bubble {
  position: relative;
  border-radius: 8rpx;
  padding: 18rpx 24rpx;
  font-size: 30rpx;
  line-height: 44rpx;
  word-break: break-all;
}

.im-message-bubble--self {
  background: #95ec69;
  color: #1f1f1f;

  &::after {
    position: absolute;
    top: 20rpx;
    right: -8rpx;
    content: '';
    border: 9rpx solid transparent;
    border-left-color: #95ec69;
  }
}

.im-message-bubble--other {
  background: #fff;
  color: #333;

  &::after {
    position: absolute;
    top: 20rpx;
    left: -8rpx;
    content: '';
    border: 9rpx solid transparent;
    border-right-color: #fff;
  }
}

.im-message-bubble--centered {
  background: #fff;
  color: #333;
}

.im-message-bubble--plain,
.im-message-bubble--embedded {
  padding: 0;
  background: transparent;
  box-shadow: none;
  font-size: inherit;

  &::after {
    display: none;
  }
}
</style>
