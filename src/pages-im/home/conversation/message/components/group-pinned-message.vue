<template>
  <view
    class="flex items-center gap-16rpx border-b border-b-[#eee] bg-white px-24rpx py-18rpx"
    @click="handleOpen"
  >
    <wd-icon name="pin" size="32rpx" color="#576b95" />
    <text class="line-clamp-1 min-w-0 flex-1 text-26rpx text-[#555]">
      {{ latestMessage ? getMessageSummary(latestMessage.type, latestMessage.content) : '' }}
    </text>
    <text v-if="messages.length > 1" class="shrink-0 text-24rpx text-[#999]">
      共 {{ messages.length }} 条
    </text>
    <text
      v-if="canManage && messages.length === 1"
      class="shrink-0 text-24rpx text-[#576b95]"
      @click.stop="handleRemove(latestMessage)"
    >
      取消置顶
    </text>
  </view>

  <!-- 全部置顶消息 -->
  <wd-popup v-model="visible" root-portal position="bottom" custom-style="height: 68vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col overflow-hidden bg-[#f5f5f5]">
      <view class="flex shrink-0 items-center justify-between border-b border-b-[#eee] bg-white px-28rpx py-24rpx">
        <text class="text-30rpx text-[#333] font-semibold">置顶消息（{{ messages.length }}）</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <scroll-view scroll-y class="min-h-0 flex-1 px-24rpx py-20rpx">
        <view
          v-for="message in displayMessages"
          :key="message.id"
          class="mb-16rpx rounded-12rpx bg-white px-24rpx py-22rpx"
          @click="handleLocate(message)"
        >
          <view class="flex items-center gap-16rpx">
            <text class="line-clamp-2 min-w-0 flex-1 text-27rpx text-[#333]">
              {{ getMessageSummary(message.type, message.content) }}
            </text>
            <text
              v-if="canManage"
              class="shrink-0 text-24rpx text-[#576b95]"
              @click.stop="handleRemove(message)"
            >
              取消置顶
            </text>
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Message } from '../../../types'
import { computed, ref } from 'vue'
import { getMessageSummary } from '@/pages-im/utils/conversation'

const props = defineProps<{
  messages: Message[] // 置顶消息列表
  canManage?: boolean // 是否可取消置顶
}>()

const emit = defineEmits<{
  locate: [message: Message] // 定位消息
  remove: [message: Message] // 取消置顶
}>()

const visible = ref(false) // 全部置顶消息弹窗
const latestMessage = computed(() => props.messages[props.messages.length - 1]) // 最新置顶消息
const displayMessages = computed(() => [...props.messages].reverse()) // 最新置顶消息优先

/** 打开置顶消息 */
function handleOpen() {
  if (!latestMessage.value) {
    return
  }
  if (props.messages.length === 1) {
    emit('locate', latestMessage.value)
    return
  }
  visible.value = true
}

/** 定位置顶消息 */
function handleLocate(message: Message) {
  visible.value = false
  emit('locate', message)
}

/** 取消置顶消息 */
function handleRemove(message?: Message) {
  if (!message) {
    return
  }
  emit('remove', message)
}
</script>
