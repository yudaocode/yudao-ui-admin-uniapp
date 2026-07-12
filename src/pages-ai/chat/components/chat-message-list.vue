<template>
  <scroll-view
    scroll-y
    class="h-full"
    :scroll-into-view="scrollIntoView"
    scroll-with-animation
  >
    <view v-if="messages.length === 0" class="px-32rpx pb-48rpx pt-120rpx">
      <view class="text-52rpx text-[#333] font-semibold leading-68rpx">
        Hi，今天想聊点什么？
      </view>
      <view class="mt-16rpx text-27rpx text-[#999] leading-42rpx">
        {{ activeConversation ? '有问题尽管问，我会认真帮你梳理。' : '选择一个对话，或者直接开始新的聊天。' }}
      </view>
      <view class="mt-48rpx flex flex-col gap-18rpx">
        <view
          v-for="item in suggestions"
          :key="item"
          class="rounded-28rpx bg-white px-28rpx py-24rpx text-28rpx text-[#333] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.04)]"
          @click="emit('suggestion', item)"
        >
          {{ item }}
        </view>
      </view>
    </view>
    <view v-else class="px-28rpx py-28rpx">
      <view
        v-for="(message, index) in messages"
        :id="`msg-${index}`"
        :key="`${message.id || index}-${message.type}`"
        class="mb-44rpx flex flex-col"
        :class="message.type === 'user' ? 'items-end' : 'items-start'"
      >
        <view v-if="message.type !== 'user'" class="mb-16rpx flex items-center gap-12rpx">
          <wd-img
            v-if="props.activeConversation?.roleAvatar"
            :src="props.activeConversation.roleAvatar"
            width="44rpx"
            height="44rpx"
            radius="14rpx"
            mode="aspectFill"
          />
          <view v-else class="h-44rpx w-44rpx flex items-center justify-center rounded-14rpx bg-[#1677ff] text-24rpx text-white font-semibold">
            AI
          </view>
          <text class="text-26rpx text-[#333] font-medium">{{ props.activeConversation?.title || 'AI 助手' }}</text>
        </view>
        <view
          class="text-29rpx text-[#333] leading-48rpx"
          :class="message.type === 'user' ? 'max-w-[88%] rounded-[32rpx_32rpx_8rpx_32rpx] bg-[#e6f4ff] px-26rpx py-20rpx' : 'w-full'"
        >
          <ReasoningContent
            v-if="message.reasoningContent"
            :content="message.reasoningContent"
            :in-progress="inProgress && index === messages.length - 1 && message.type === 'assistant'"
          />
          <view
            v-if="inProgress && message.type === 'assistant' && !message.content && !message.reasoningContent"
            class="ai-typing"
          >
            <text class="ai-typing-dot" />
            <text class="ai-typing-dot ai-typing-dot-second" />
            <text class="ai-typing-dot ai-typing-dot-third" />
          </view>
          <YdMarkdown
            v-else-if="message.content && message.type !== 'user'"
            :content="message.content"
          />
          <view v-else-if="message.content" class="whitespace-pre-wrap">
            {{ message.content || '' }}
          </view>
          <MessageAttachments :urls="message.attachmentUrls" />
          <KnowledgeReference :segments="message.segments" />
          <WebSearchReference :pages="message.webSearchPages" />
        </view>
        <view class="mt-12rpx flex items-center gap-16rpx text-22rpx text-[#999]">
          <text v-if="message.createTime">{{ formatMessageTime(message.createTime) }}</text>
          <wd-icon name="more" size="32rpx" color="#999" @click="emit('messageMore', message)" />
        </view>
      </view>
    </view>
    <view id="bottom-anchor" />
  </scroll-view>
</template>

<script lang="ts" setup>
import type { ChatConversation } from '@/api/ai/chat/conversation'
import type { ChatMessage } from '@/api/ai/chat/message'
import YdMarkdown from '@/pages-ai/components/yd-markdown/yd-markdown.vue'
import { formatDate } from '@/utils/date'
import KnowledgeReference from './knowledge-reference.vue'
import MessageAttachments from './message-attachments.vue'
import ReasoningContent from './reasoning-content.vue'
import WebSearchReference from './web-search-reference.vue'

const props = defineProps<{
  messages: ChatMessage[]
  activeConversation?: ChatConversation
  inProgress: boolean
  scrollIntoView: string
  suggestions: string[]
}>()

const emit = defineEmits<{
  suggestion: [content: string]
  messageMore: [message: ChatMessage]
}>()

/** 格式化消息时间 */
function formatMessageTime(time: string) {
  return formatDate(time, 'HH:mm')
}
</script>

<style lang="scss" scoped>
.ai-typing {
  display: flex;
  gap: 10rpx;
  align-items: center;
  height: 48rpx;

  &-dot {
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
    background: #999;
    animation: ai-typing-bounce 1.2s infinite ease-in-out;
  }

  &-dot-second {
    animation-delay: 0.15s;
  }

  &-dot-third {
    animation-delay: 0.3s;
  }
}

@keyframes ai-typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  30% {
    transform: translateY(-8rpx);
    opacity: 1;
  }
}
</style>
