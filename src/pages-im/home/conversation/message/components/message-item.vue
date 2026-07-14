<template>
  <view
    class="mb-28rpx"
    :class="selectMode && canMultiSelect ? 'flex items-start gap-12rpx px-8rpx' : ''"
    @click="onRootClick"
  >
    <!-- 多选勾选框 -->
    <view v-if="selectMode && canMultiSelect" class="shrink-0" :style="{ paddingTop: showTime ? '62rpx' : '6rpx' }">
      <wd-icon
        :name="selected ? 'check-circle-fill' : 'check-circle'"
        size="44rpx"
        :color="selected ? '#07c160' : '#ccc'"
      />
    </view>
    <view :class="selectMode && canMultiSelect ? 'min-w-0 flex-1' : ''">
      <!-- 时间分隔 -->
      <view v-if="showTime" class="mb-12rpx text-center text-22rpx text-[#aaa]">
        {{ formatTimeTip(toTimestamp(message.sendTime)) }}
      </view>
      <!-- 私聊通话记录：保留一键重拨能力 -->
      <view
        v-if="privateRtcCallPayload"
        class="flex items-start gap-16rpx"
        :class="isSelf ? 'flex-row-reverse' : ''"
      >
        <view @click.stop="onAvatarClick">
          <ImAvatar :src="senderAvatar" :name="senderRealNickname" size="80rpx" :round="false" />
        </view>
        <view
          class="flex items-center gap-12rpx rounded-8rpx px-24rpx py-18rpx text-28rpx"
          :class="isSelf ? 'bg-[#95ec69] text-[#222]' : 'bg-white text-[#333]'"
          @click.stop="onRtcRedial"
        >
          <wd-icon name="phone" size="34rpx" />
          <text>{{ privateRtcCallText }}</text>
        </view>
      </view>
      <!-- 系统提示（撤回 / 群通知 / 好友提示 / 群通话）：居中灰条 -->
      <view v-else-if="isSystemTip" class="py-6rpx text-center text-22rpx text-[#999]">
        <MessageTipSegments
          v-if="systemTipSegments.length"
          :segments="systemTipSegments"
          @mention-click="onMentionClick"
        />
        <text v-else>{{ systemTipText }}</text>
      </view>
      <!-- 普通消息 -->
      <view v-else class="flex items-start gap-16rpx" :class="isSelf ? 'flex-row-reverse' : ''">
        <view @click.stop="onAvatarClick">
          <ImAvatar :src="senderAvatar" :name="senderRealNickname" size="80rpx" :round="false" />
        </view>
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
              :mentions="mentionCandidates"
              @material-click="emit('material-click', $event)"
              @merge-click="emit('merge-click', $event)"
              @card-click="emit('card-click', $event)"
              @mention-click="onMentionClick"
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
import type {
  CardMessage,
  MaterialMessage,
  MergeMessage,
  QuoteMessage,
} from '@/pages-im/utils/message'
import type { Message } from '../../../types'
import { computed } from 'vue'
import {
  ImConversationType,
  ImMessageReceiptStatus,
  ImMessageStatus,
  ImMessageType,
  isFriendChatTip,
  isGroupNotification,
  isNormalMessage,
  isRtcCallTip,
} from '@/pages-im/utils/constants'
import MessageContent from '@/pages-im/components/message-content.vue'
import { buildRecallTipSegments, getMessageSummary } from '@/pages-im/utils/conversation'
import {
  getQuoteFromMessage,
  parseRtcCallPayload,
  resolveFriendNotificationSegments,
  resolveGroupNotificationSegments,
  resolveRtcCallPrivateBubbleText,
  resolveRtcCallTipSegments,
} from '@/pages-im/utils/message'
import {
  getMentionCandidates,
  getSenderAvatar,
  getSenderDisplayName,
  getSenderRealNickname,
} from '@/pages-im/utils/user'
import { MESSAGE_GROUP_READ_ENABLED, MESSAGE_PRIVATE_READ_ENABLED } from '@/pages-im/utils/config'
import { formatTimeTip, toTimestamp } from '@/pages-im/utils/time'
import ImAvatar from '../../../components/im-avatar.vue'
import MessageQuote from './message-quote.vue'
import MessageTipSegments from './message-tip-segments.vue'

const props = defineProps<{
  message: Message // 消息数据
  conversationType: number // 会话类型 ImConversationType
  targetId: number // 会话目标编号
  selfUserId?: number // 当前登录用户编号
  selfName?: string // 当前用户昵称
  selfAvatar?: string // 当前用户头像
  peerName?: string // 私聊对方昵称
  peerAvatar?: string // 私聊对方头像
  privateMaxReadMessageId?: number // 私聊对方已读位置
  showTime?: boolean // 是否展示时间分隔
  selectMode?: boolean // 多选模式
  selected?: boolean // 是否选中
}>()

const emit = defineEmits<{
  'longpress': [message: Message] // 长按消息
  'scroll-to-quote': [content: string] // 点击引用滚动到原消息
  'material-click': [payload: MaterialMessage] // 点击频道素材
  'merge-click': [payload: MergeMessage] // 点击合并转发
  'card-click': [payload: CardMessage] // 点击名片
  'mention-click': [userId: number] // 点击 @ 用户
  'rtc-redial': [mediaType: number] // 重拨私聊通话
  'toggle-select': [message: Message] // 多选切换
  'show-readers': [message: Message] // 查看群已读成员
  'retry': [message: Message] // 重试失败消息
  'avatar-click': [userId: number] // 点击发送人头像
}>()

// 媒体类型不套气泡背景（图片 / 表情 / 视频，仿微信直显）
const PLAIN_TYPES: number[] = [ImMessageType.IMAGE, ImMessageType.FACE, ImMessageType.VIDEO]
const canMultiSelect = computed(() => !!props.message.id
  && isNormalMessage(props.message.type)
  && props.message.status !== ImMessageStatus.RECALL) // 是否允许加入消息多选

/** 点击发送状态：群聊自己消息查看已读成员 */
function onStatusClick() {
  if (props.selectMode) {
    return
  }
  if (props.message.status === ImMessageStatus.FAILED) {
    emit('retry', props.message)
    return
  }
  const message = props.message
  if (props.conversationType === ImConversationType.GROUP
    && message.senderId === props.selfUserId
    && message.receiptStatus !== undefined
    && message.receiptStatus !== ImMessageReceiptStatus.NO_RECEIPT) {
    emit('show-readers', props.message)
  }
}

/** 根节点点击：多选模式下切换选中 */
function onRootClick() {
  if (props.selectMode && canMultiSelect.value) {
    emit('toggle-select', props.message)
  }
}

/** 点击头像 */
function onAvatarClick() {
  if (props.selectMode) {
    if (canMultiSelect.value) {
      emit('toggle-select', props.message)
    }
    return
  }
  emit('avatar-click', props.message.senderId)
}

/** 点击 @ 用户 */
function onMentionClick(userId: number) {
  if (!props.selectMode) {
    emit('mention-click', userId)
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

/** 私聊通话结束消息内容 */
const privateRtcCallPayload = computed(() => {
  if (props.message.type !== ImMessageType.RTC_CALL_END) {
    return null
  }
  const payload = parseRtcCallPayload(props.message.content)
  return payload?.conversationType === ImConversationType.PRIVATE ? payload : null
})

/** 重拨私聊通话 */
function onRtcRedial() {
  if (!props.selectMode && privateRtcCallPayload.value?.mediaType) {
    emit('rtc-redial', privateRtcCallPayload.value.mediaType)
  }
}

/** 获取群成员展示名 */
function getGroupUserName(userId: number) {
  if (userId === props.selfUserId) {
    return '你'
  }
  return getSenderDisplayName(userId, props.conversationType, props.targetId)
}

/** 是否媒体类型（不套气泡） */
const plain = computed(() => PLAIN_TYPES.includes(props.message.type))

/** 是否展示发送人昵称（群聊对方） */
const showSenderName = computed(() => isGroup.value && !isSelf.value)
const mentionCandidates = computed(() => getMentionCandidates(
  props.message.atUserIds,
  isGroup.value
    ? { type: props.conversationType, targetId: props.targetId }
    : undefined,
)) // 文本中的 @ 候选

/** 发送人名称 */
const senderName = computed(() => {
  if (isSelf.value) {
    return props.selfName || '我'
  }
  if (isGroup.value) {
    return getSenderDisplayName(
      props.message.senderId,
      props.conversationType,
      props.targetId,
      props.peerName,
    )
  }
  return props.peerName || `用户 ${props.message.senderId}`
})

/** 发送人真实昵称（头像兜底使用） */
const senderRealNickname = computed(() => {
  if (isSelf.value) {
    return props.selfName || '我'
  }
  return getSenderRealNickname(
    props.message.senderId,
    props.conversationType,
    props.targetId,
  )
})

/** 系统提示结构化分段 */
const systemTipSegments = computed(() => {
  if (props.message.type === ImMessageType.RECALL) {
    return buildRecallTipSegments(
      props.message.senderId,
      isSelf.value,
      props.conversationType,
      props.targetId,
      senderName.value,
    )
  }
  if (isFriendChatTip(props.message.type)) {
    return resolveFriendNotificationSegments(props.message)
  }
  if (isGroupNotification(props.message.type)) {
    return resolveGroupNotificationSegments(
      props.message,
      userId => getSenderDisplayName(userId, props.conversationType, props.targetId),
    )
  }
  if (isRtcCallTip(props.message.type)) {
    return resolveRtcCallTipSegments(props.message)
  }
  return []
})

/** 私聊通话记录文案 */
const privateRtcCallText = computed(() => resolveRtcCallPrivateBubbleText(privateRtcCallPayload.value))

/** 系统提示文案 */
const systemTipText = computed(() => {
  if (props.message.type === ImMessageType.RECALL) {
    return isSelf.value ? '你撤回了一条消息' : `${senderName.value} 撤回了一条消息`
  }
  return getMessageSummary(props.message.type, props.message.content, getGroupUserName)
})

/** 发送人头像 */
const senderAvatar = computed(() => {
  if (isSelf.value) {
    return props.selfAvatar
  }
  if (isGroup.value) {
    return getSenderAvatar(props.message.senderId, props.conversationType, props.targetId)
  }
  return props.peerAvatar
})

/** 引用发送人名称 */
function getQuoteSenderName(quote: QuoteMessage) {
  if (quote.senderId === props.selfUserId) {
    return '我'
  }
  if (isGroup.value) {
    return getSenderDisplayName(quote.senderId, props.conversationType, props.targetId)
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
    if (!MESSAGE_PRIVATE_READ_ENABLED) {
      return ''
    }
    if ((message.id && props.privateMaxReadMessageId && message.id <= props.privateMaxReadMessageId)
      || message.receiptStatus === ImMessageReceiptStatus.DONE) {
      return '已读'
    }
    return message.receiptStatus === ImMessageReceiptStatus.PENDING ? '未读' : ''
  }
  if (isGroup.value) {
    if (!MESSAGE_GROUP_READ_ENABLED) {
      return ''
    }
    if (message.receiptStatus === ImMessageReceiptStatus.DONE) {
      return '全部已读'
    }
    if (message.receiptStatus === ImMessageReceiptStatus.PENDING) {
      return message.readCount ? `${message.readCount} 人已读` : '未读'
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
