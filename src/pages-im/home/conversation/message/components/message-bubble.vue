<template>
  <view
    class="im-message-bubble"
    :class="[
      centered ? 'im-message-bubble--centered' : isSelf ? 'im-message-bubble--self' : 'im-message-bubble--other',
      plain ? 'im-message-bubble--plain' : '',
    ]"
    @longpress="emit('longpress')"
  >
    <ReplyPreview
      v-if="quote"
      :quote="quote"
      :sender-name="quoteSenderName"
      :recalled="quoteRecalled"
      clickable
      :mirrored="isSelf"
      class="mb-12rpx"
      @locate="emit('scroll-to-quote', $event)"
    />
    <MessageContent
      :type="message.type"
      :content="message.content"
      :conversation-type="conversationType"
      :mentions="mentions"
      :upload-progress="message.uploadProgress"
      @material-click="emit('material-click', $event)"
      @merge-click="emit('merge-click', $event)"
      @card-click="emit('card-click', $event)"
      @mention-click="emit('mention-click', $event)"
    />
  </view>
</template>

<script lang="ts" setup>
import type {
  CardMessage,
  MaterialMessage,
  MentionCandidate,
  QuoteMessage,
} from '@/pages-im/utils/message'
import type { Message } from '../../../types'
import { computed } from 'vue'
import { ImMessageType } from '@/pages-im/utils/constants'
import MessageContent from '@/pages-im/home/components/message-content.vue'
import ReplyPreview from './reply-preview.vue'

const props = defineProps<{
  message: Message // 消息数据
  isSelf: boolean // 是否自己发送
  conversationType: number // 当前会话类型
  quote?: QuoteMessage // 引用消息快照
  quoteSenderName?: string // 引用发送人名称
  quoteRecalled?: boolean // 原消息是否已撤回
  mentions?: MentionCandidate[] // 文本中的 @ 候选
  centered?: boolean // 是否使用居中无箭头样式
}>()

const emit = defineEmits<{
  'longpress': [] // 长按消息
  'scroll-to-quote': [messageId: number] // 定位引用原消息
  'material-click': [payload: MaterialMessage] // 点击频道素材
  'merge-click': [content: string] // 点击合并转发
  'card-click': [payload: CardMessage] // 点击名片
  'mention-click': [userId: number] // 点击 @ 用户
}>()

const plainTypes: number[] = [ // 媒体直显消息类型
  ImMessageType.IMAGE,
  ImMessageType.FACE,
  ImMessageType.VIDEO,
]
const plain = computed(() => plainTypes.includes(props.message.type)) // 是否媒体直显消息
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

.im-message-bubble--plain {
  padding: 0;
  background: transparent;
  box-shadow: none;

  &::after {
    display: none;
  }
}
</style>
