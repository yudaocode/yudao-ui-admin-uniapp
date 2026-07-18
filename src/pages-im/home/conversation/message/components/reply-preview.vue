<template>
  <view
    class="min-w-0 flex items-center gap-12rpx rounded-8rpx bg-black/5 px-16rpx py-10rpx text-24rpx text-[#666] leading-34rpx"
    :class="[
      mirrored ? 'flex-row-reverse text-right' : '',
      clickable && !recalled ? 'active:bg-black/10' : '',
    ]"
    @click.stop="handleClick"
  >
    <text v-if="senderName" class="shrink-0">{{ senderName }}：</text>
    <text v-if="recalled" class="min-w-0 flex-1 italic">原消息已撤回</text>
    <template v-else-if="quote">
      <wd-img
        v-if="thumbnailUrl"
        :src="thumbnailUrl"
        width="52rpx"
        height="52rpx"
        radius="6rpx"
        mode="aspectFill"
      />
      <wd-icon v-else-if="quote.type === ImMessageType.FILE" name="folder" size="30rpx" />
      <wd-icon v-else-if="quote.type === ImMessageType.VOICE" name="sound" size="30rpx" />
      <text selectable class="line-clamp-2 min-w-0 flex-1 break-all">{{ previewText }}</text>
    </template>
    <text v-else selectable class="line-clamp-2 min-w-0 flex-1 break-all">{{ title }}</text>
    <wd-icon v-if="closable" name="close" size="28rpx" @click.stop="emit('close')" />
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
  TextMessage,
  VideoMessage,
} from '@/pages-im/utils/message'
import type { QuoteMessage } from '../../../types'
import { computed } from 'vue'
import { ImConversationType, ImMessageType } from '@/pages-im/utils/constants'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { getImageUrl } from '@/pages-im/utils/image'
import { parseMessage } from '@/pages-im/utils/message'
import { formatFileSize } from '@/utils/download'

type QuotePayload = Partial<TextMessage & ImageMessage & FileMessage & AudioMessage
  & VideoMessage & CardMessage & FaceMessage & MaterialMessage>

const props = defineProps<{
  quote?: QuoteMessage // 引用消息快照
  senderName?: string // 引用发送人名称
  recalled?: boolean // 原消息是否已撤回
  title?: string // 无引用快照时的提示文案
  clickable?: boolean // 是否可定位原消息
  closable?: boolean // 是否可关闭引用
  mirrored?: boolean // 是否镜像到自己消息一侧
}>()

const emit = defineEmits<{
  locate: [messageId: number] // 定位原消息
  close: [] // 清除引用
}>()

const payload = computed(() => parseMessage<QuotePayload>(props.quote?.content)) // 引用消息内容
const thumbnailUrl = computed(() => {
  if (!props.quote || props.recalled) {
    return ''
  }
  if (props.quote.type === ImMessageType.IMAGE) {
    return getImageUrl(payload.value)
  }
  if (props.quote.type === ImMessageType.VIDEO || props.quote.type === ImMessageType.MATERIAL) {
    return payload.value?.coverUrl || ''
  }
  if (props.quote.type === ImMessageType.FACE) {
    return payload.value?.url || ''
  }
  return ''
}) // 引用缩略图

/** 获取引用内容文案 */
const previewText = computed(() => {
  const quote = props.quote
  const value = payload.value
  if (!quote) {
    return props.title || ''
  }
  if (quote.type === ImMessageType.TEXT) {
    const text = value?.content || ''
    return text.length > 60 ? `${text.slice(0, 60)}…` : text
  }
  if (quote.type === ImMessageType.FILE) {
    return `${value?.name || '文件'}${value?.size ? ` ${formatFileSize(value.size)}` : ''}`
  }
  if (quote.type === ImMessageType.VOICE) {
    return value?.duration ? `${value.duration}″` : '[语音]'
  }
  if (quote.type === ImMessageType.CARD) {
    const label = value?.targetType === ImConversationType.GROUP ? '群名片' : '个人名片'
    return `[${label}] ${value?.name || ''}`.trim()
  }
  if (quote.type === ImMessageType.FACE) {
    return value?.name ? `[表情] ${value.name}` : '[表情]'
  }
  if (quote.type === ImMessageType.MATERIAL) {
    return `[频道] ${value?.title || ''}`.trim()
  }
  return getMessageSummary(quote.type, quote.content)
})

/** 点击引用预览 */
function handleClick() {
  if (props.clickable && !props.recalled && props.quote?.messageId) {
    emit('locate', props.quote.messageId)
  }
}
</script>
