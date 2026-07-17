<template>
  <view v-if="messages.length" class="relative z-1 shrink-0 bg-[#ededed] px-20rpx py-12rpx">
    <!-- 折叠状态：展示最新一条置顶消息 -->
    <view
      v-if="!expanded"
      class="flex items-center gap-14rpx rounded-12rpx bg-white px-20rpx py-18rpx shadow-[0_2rpx_6rpx_rgba(0,0,0,0.04)]"
      @click="handleTopClick"
    >
      <view class="i-carbon-pin-filled h-32rpx w-32rpx shrink-0 text-[#f5b800]" />
      <text class="max-w-180rpx shrink-0 truncate text-26rpx text-[#666]">
        {{ getSenderName(latestMessage) }}：
      </text>
      <text class="line-clamp-1 min-w-0 flex-1 text-26rpx text-[#333]">
        {{ getPreview(latestMessage) }}
      </text>
      <text
        v-if="canManage && messages.length === 1"
        class="shrink-0 text-25rpx text-[#576b95]"
        @click.stop="handleRemove(latestMessage)"
      >
        移除
      </text>
      <template v-else-if="messages.length > 1">
        <text class="shrink-0 text-24rpx text-[#888]">共 {{ messages.length }} 条</text>
        <wd-icon name="arrow-down" size="24rpx" color="#999" />
      </template>
    </view>

    <!-- 展开状态：从聊天顶部覆盖展示全部置顶消息 -->
    <view
      v-else
      class="absolute left-0 right-0 top-0 z-30 bg-[#ededed] px-20rpx pb-16rpx pt-12rpx shadow-[0_12rpx_24rpx_rgba(0,0,0,0.12)]"
    >
      <scroll-view scroll-y class="max-h-520rpx">
        <view
          v-for="message in displayMessages"
          :key="message.id"
          class="mb-12rpx flex items-center gap-14rpx rounded-12rpx bg-white px-20rpx py-18rpx"
          @click="handleLocate(message)"
        >
          <view class="i-carbon-pin-filled h-32rpx w-32rpx shrink-0 text-[#f5b800]" />
          <text class="max-w-180rpx shrink-0 truncate text-26rpx text-[#666]">
            {{ getSenderName(message) }}：
          </text>
          <text class="line-clamp-1 min-w-0 flex-1 text-26rpx text-[#333]">
            {{ getPreview(message) }}
          </text>
          <text
            v-if="canManage"
            class="shrink-0 text-25rpx text-[#576b95]"
            @click.stop="handleRemove(message)"
          >
            移除
          </text>
        </view>
      </scroll-view>
      <view class="flex justify-center pt-4rpx" @click="expanded = false">
        <view class="h-40rpx min-w-88rpx flex items-center justify-center rounded-full bg-[#d8d8d8]">
          <wd-icon name="arrow-up" size="28rpx" color="#666" />
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Message } from '../../../types'
import { computed, ref, watch } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { unpinGroupMessage } from '@/api/im/group'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { getSenderDisplayName } from '@/pages-im/utils/user'
import { ImConversationType } from '@/pages-im/utils/constants'
import { useGroupStore } from '../../../store/groupStore'

const props = defineProps<{
  groupId: number // 群编号
  canManage: boolean // 是否可取消置顶
}>()

const emit = defineEmits<{
  locate: [messageId: number] // 定位消息
}>()

const toast = useToast()
const groupStore = useGroupStore()
const expanded = ref(false) // 是否展开全部置顶消息
const pinningMessageId = ref<number>() // 正在取消置顶的消息编号
const messages = computed(() => groupStore.getGroup(props.groupId)?.pinnedMessages || []) // 置顶消息列表
const latestMessage = computed(() => messages.value[messages.value.length - 1]) // 最新置顶消息
const displayMessages = computed(() => messages.value) // 按置顶先后顺序展示

/** 点击顶部置顶消息 */
function handleTopClick() {
  if (!latestMessage.value) {
    return
  }
  if (messages.value.length === 1) {
    if (latestMessage.value.id) {
      emit('locate', latestMessage.value.id)
    }
    return
  }
  expanded.value = true
}

/** 定位置顶消息 */
function handleLocate(message: Message) {
  expanded.value = false
  if (message.id) {
    emit('locate', message.id)
  }
}

/** 获取置顶消息发送人 */
function getSenderName(message?: Message) {
  return message
    ? getSenderDisplayName(message.senderId, ImConversationType.GROUP, message.targetId)
    : ''
}

/** 获取置顶消息摘要 */
function getPreview(message?: Message) {
  return message ? getMessageSummary(message.type, message.content) : ''
}

/** 取消置顶消息 */
async function handleRemove(message?: Message) {
  if (!message?.id || !props.canManage || pinningMessageId.value != null) {
    return
  }
  pinningMessageId.value = message.id
  try {
    await unpinGroupMessage({ id: props.groupId, messageId: message.id })
    toast.success('已取消置顶')
    await groupStore.fetchGroupInfo(props.groupId, true)
  } finally {
    pinningMessageId.value = undefined
  }
}

/** 置顶消息减少为一条时退出展开状态 */
watch(() => messages.value.length, (length) => {
  if (length <= 1) {
    expanded.value = false
  }
})
</script>
