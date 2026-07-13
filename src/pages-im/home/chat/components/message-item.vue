<template>
  <view
    class="mb-28rpx"
    :class="selectMode ? 'flex items-start gap-12rpx px-8rpx' : ''"
    @click="onRootClick"
  >
    <!-- 多选勾选框 -->
    <view v-if="selectMode" class="shrink-0" :style="{ paddingTop: showTime ? '62rpx' : '6rpx' }">
      <wd-icon
        :name="selected ? 'check-circle-fill' : 'check-circle'"
        size="44rpx"
        :color="selected ? '#07c160' : '#ccc'"
      />
    </view>
    <view :class="selectMode ? 'min-w-0 flex-1' : ''">
      <!-- 时间分隔 -->
      <view v-if="showTime" class="mb-12rpx text-center text-22rpx text-[#aaa]">
        {{ formatDateTime(message.sendTime) }}
      </view>
      <!-- 系统提示（撤回 / 群通知 / 好友提示 / 通话）：居中灰条 -->
      <view v-if="isSystemTip" class="py-6rpx text-center text-22rpx text-[#999]">
        <text>{{ systemTipText }}</text>
      </view>
      <!-- 普通消息 -->
      <view v-else class="flex items-start gap-16rpx" :class="isSelf ? 'flex-row-reverse' : ''">
        <ImAvatar :src="senderAvatar" :name="senderName" size="80rpx" :round="false" />
        <view class="max-w-[560rpx] flex flex-col" :class="isSelf ? 'items-end' : 'items-start'">
          <!-- 群聊对方昵称 -->
          <view v-if="showSenderName" class="mb-8rpx text-22rpx text-[#999]">
            {{ senderName }}
          </view>
          <!-- 气泡 -->
          <view
            class="im-bubble"
            :class="[isSelf ? 'im-bubble--self' : 'im-bubble--other', plain ? 'im-bubble--plain' : '']"
            @longpress="onBubbleLongpress"
          >
            <MessageQuote
              v-if="quoteTitle"
              :title="quoteTitle"
              class="mb-12rpx"
              @click="emit('scroll-to-quote', message.content)"
            />
            <MessageContent
              :type="message.type"
              :content="message.content"
              @material-click="emit('material-click', $event)"
              @merge-click="emit('merge-click', $event)"
              @card-click="emit('card-click', $event)"
            />
          </view>
          <!-- 发送状态 -->
          <view
            v-if="statusText"
            class="mt-8rpx text-22rpx text-[#bbb]"
            :class="isSelf ? 'text-right' : 'text-left'"
            @click="onStatusClick"
          >
            {{ statusText }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type {
  ImCardMessage,
  ImMaterialMessage,
  ImMergeMessage,
  ImQuoteMessage,
} from '@/pages-im/utils/message'
import type { ChatMessage } from '../../types'
import { computed } from 'vue'
import {
  ImConversationType,
  ImMessageReceiptStatus,
  ImMessageStatus,
  ImMessageType,
  isFriendChatTip,
  isGroupNotification,
  isRtcCallTip,
} from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import MessageContent from '@/pages-im/components/message-content.vue'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { getQuoteFromMessage } from '@/pages-im/utils/message'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import ImAvatar from '../../components/im-avatar.vue'
import MessageQuote from './message-quote.vue'

const props = defineProps<{
  message: ChatMessage // 消息数据
  conversationType: number // 会话类型 ImConversationType
  selfUserId?: number // 当前登录用户编号
  selfName?: string // 当前用户昵称
  selfAvatar?: string // 当前用户头像
  peerName?: string // 私聊对方昵称
  peerAvatar?: string // 私聊对方头像
  groupMembers?: ImGroupMemberRespVO[] // 群成员（群聊用于解析昵称/头像）
  privateMaxReadMessageId?: number // 私聊对方已读位置
  showTime?: boolean // 是否展示时间分隔
  selectMode?: boolean // 多选模式
  selected?: boolean // 是否选中
}>()

const emit = defineEmits<{
  'longpress': [message: ChatMessage] // 长按消息
  'scroll-to-quote': [content: string] // 点击引用滚动到原消息
  'material-click': [payload: ImMaterialMessage] // 点击频道素材
  'merge-click': [payload: ImMergeMessage] // 点击合并转发
  'card-click': [payload: ImCardMessage] // 点击名片
  'toggle-select': [message: ChatMessage] // 多选切换
  'show-readers': [message: ChatMessage] // 查看群已读成员
  'retry': [message: ChatMessage] // 重试失败消息
}>()

// 媒体类型不套气泡背景（图片 / 表情 / 视频，仿微信直显）
const PLAIN_TYPES: number[] = [ImMessageType.IMAGE, ImMessageType.FACE, ImMessageType.VIDEO]

/** 点击发送状态：群聊自己消息查看已读成员 */
function onStatusClick() {
  if (props.selectMode) {
    return
  }
  if (props.message.status === ImMessageStatus.FAILED) {
    emit('retry', props.message)
    return
  }
  const message = props.message as ImGroupMessageRespVO
  if (props.conversationType === ImConversationType.GROUP
    && message.senderId === props.selfUserId
    && message.receiptStatus !== undefined
    && message.receiptStatus !== ImMessageReceiptStatus.NO_RECEIPT) {
    emit('show-readers', props.message)
  }
}

/** 根节点点击：多选模式下切换选中 */
function onRootClick() {
  if (props.selectMode) {
    emit('toggle-select', props.message)
  }
}

/** 气泡长按：非多选模式才弹操作菜单 */
function onBubbleLongpress() {
  if (!props.selectMode) {
    emit('longpress', props.message)
  }
}

const isGroup = computed(() => props.conversationType === ImConversationType.GROUP) // 是否群聊
const isSelf = computed(() => props.message.senderId === props.selfUserId) // 是否自己发送

/** 是否系统提示消息（撤回 / 群通知 / 好友提示 / 通话提示） */
const isSystemTip = computed(() => {
  const type = props.message.type ?? -1
  return type === ImMessageType.RECALL
    || isFriendChatTip(type)
    || isGroupNotification(type)
    || isRtcCallTip(type)
})

/** 系统提示文案 */
const systemTipText = computed(() => getMessageSummary(props.message.type, props.message.content))

/** 是否媒体类型（不套气泡） */
const plain = computed(() => PLAIN_TYPES.includes(props.message.type))

/** 是否展示发送人昵称（群聊对方） */
const showSenderName = computed(() => isGroup.value && !isSelf.value)

/** 发送人名称 */
const senderName = computed(() => {
  if (isSelf.value) {
    return props.selfName || '我'
  }
  if (isGroup.value) {
    return getMemberDisplayName(props.groupMembers?.find(member => member.userId === props.message.senderId))
  }
  return props.peerName || `用户 ${props.message.senderId}`
})

/** 发送人头像 */
const senderAvatar = computed(() => {
  if (isSelf.value) {
    return props.selfAvatar
  }
  if (isGroup.value) {
    return props.groupMembers?.find(member => member.userId === props.message.senderId)?.avatar
  }
  return props.peerAvatar
})

/** 引用发送人名称 */
function getQuoteSenderName(quote: ImQuoteMessage) {
  if (quote.senderId === props.selfUserId) {
    return '我'
  }
  if (isGroup.value) {
    return getMemberDisplayName(props.groupMembers?.find(member => member.userId === quote.senderId))
  }
  return props.peerName || `用户 ${quote.senderId}`
}

/** 引用展示文案 */
const quoteTitle = computed(() => {
  const quote = getQuoteFromMessage(props.message.content)
  if (!quote) {
    return ''
  }
  return `${getQuoteSenderName(quote)}：${getMessageSummary(quote.type, quote.content)}`
})

/** 发送状态文案 */
const statusText = computed(() => {
  const message = props.message
  if (message.type === ImMessageType.RECALL || !isSelf.value) {
    return ''
  }
  if (message.status === ImMessageStatus.FAILED) {
    return '发送失败'
  }
  if (message.status === ImMessageStatus.SENDING) {
    return '发送中'
  }
  if (props.conversationType === ImConversationType.PRIVATE) {
    return message.id && props.privateMaxReadMessageId && message.id <= props.privateMaxReadMessageId ? '已读' : '已发送'
  }
  if (isGroup.value) {
    const groupMessage = message as ImGroupMessageRespVO
    if (groupMessage.receiptStatus === ImMessageReceiptStatus.DONE) {
      return '全部已读'
    }
    if (groupMessage.receiptStatus === ImMessageReceiptStatus.PENDING) {
      return groupMessage.readCount ? `${groupMessage.readCount} 人已读` : '未读'
    }
  }
  return ''
})
</script>

<style lang="scss" scoped>
.im-bubble {
  position: relative;
  border-radius: 8rpx;
  padding: 18rpx 24rpx;
  font-size: 30rpx;
  line-height: 44rpx;
  word-break: break-all;
}

// 自己：微信绿 + 右侧小三角
.im-bubble--self {
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

// 对方：白底 + 左侧小三角
.im-bubble--other {
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

// 媒体类型：去气泡背景与三角
.im-bubble--plain {
  padding: 0;
  background: transparent;
  box-shadow: none;

  &::after {
    display: none;
  }
}
</style>
