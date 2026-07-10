<template>
  <view class="h-full flex flex-col bg-white">
    <!-- 搜索 -->
    <view class="px-24rpx pb-8rpx pt-12rpx">
      <wd-search v-model="keyword" placeholder="搜索" hide-cancel />
    </view>

    <scroll-view
      class="min-h-0 flex-1"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="!loading && filteredConversations.length === 0" class="py-160rpx">
        <wd-empty icon="message" :tip="keyword ? '无匹配会话' : '暂无会话'" />
      </view>

      <view
        v-for="item in filteredConversations"
        :key="item.clientConversationId"
        class="flex items-center gap-20rpx px-24rpx active:bg-[#f5f5f5]"
        :class="item.top ? 'bg-[#f7f8fa]' : ''"
        @click="openChat(item)"
        @longpress="handleLongPress(item)"
      >
        <view class="relative py-20rpx">
          <ImAvatar :src="item.avatar" :name="item.name" :round="false" size="92rpx" />
          <view v-if="item.unreadCount > 0" class="unread-badge">
            {{ item.unreadCount > 99 ? '99+' : item.unreadCount }}
          </view>
        </view>
        <view class="min-w-0 flex-1 border-b border-b-[#f2f3f5] py-20rpx">
          <view class="flex items-center justify-between">
            <text class="line-clamp-1 flex-1 text-32rpx text-[#222] font-medium">{{ item.name || '未命名' }}</text>
            <text class="ml-16rpx shrink-0 text-22rpx text-[#bbb]">{{ formatConversationTime(item.lastSendTime) }}</text>
          </view>
          <view class="line-clamp-1 mt-8rpx text-26rpx text-[#999]">
            <text v-if="item.silent" class="text-[#bbb]">[免打扰] </text>{{ item.lastContent || ' ' }}
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ConversationDO } from '@/pages-im/home/db'
import { computed, ref, watch } from 'vue'
import { useImConversations } from '../../composables/useImConversations'
import ImAvatar from '../../components/im-avatar.vue'

const props = defineProps<{
  active?: boolean
}>()

const { conversations, loading, load, isLoaded, setConversationTop, setConversationSilent, removeConversation } = useImConversations()
const refreshing = ref(false) // 下拉刷新状态
const keyword = ref('') // 搜索关键词

/** 按名称过滤会话 */
const filteredConversations = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) {
    return conversations.value
  }
  return conversations.value.filter(item => (item.name || '').toLowerCase().includes(kw))
})

/** 打开会话 */
function openChat(item: ConversationDO) {
  uni.navigateTo({
    url: `/pages-im/home/chat/index?type=${item.type}&targetId=${item.targetId}&title=${encodeURIComponent(item.name || '')}`,
  })
}

/** 长按会话：置顶 / 免打扰 / 删除 */
function handleLongPress(item: ConversationDO) {
  const actions = [
    item.top ? '取消置顶' : '置顶',
    item.silent ? '取消免打扰' : '免打扰',
    '删除会话',
  ]
  uni.showActionSheet({
    itemList: actions,
    success: ({ tapIndex }) => {
      if (tapIndex === 0) {
        setConversationTop(item.clientConversationId, !item.top)
      } else if (tapIndex === 1) {
        setConversationSilent(item.clientConversationId, !item.silent)
      } else if (tapIndex === 2) {
        confirmRemove(item)
      }
    },
  })
}

/** 确认删除会话 */
function confirmRemove(item: ConversationDO) {
  uni.showModal({
    title: '提示',
    content: '确定删除该会话吗？',
    success: ({ confirm }) => {
      if (confirm) {
        removeConversation(item.clientConversationId)
      }
    },
  })
}

/** 下拉刷新 */
async function onRefresh() {
  refreshing.value = true
  try {
    await load()
  } finally {
    refreshing.value = false
  }
}

/** 会话时间展示：今天 HH:mm / 昨天 / 今年 MM-DD / 跨年 YYYY-MM-DD */
function formatConversationTime(ms?: number): string {
  if (!ms) {
    return ''
  }
  const date = new Date(ms)
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  if (date.toDateString() === now.toDateString()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  if (date.getFullYear() === now.getFullYear()) {
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 首次激活时加载一次；之后靠 WebSocket 增量自更新（applyIncomingMessage），从聊天页返回不再全量重拉 */
watch(() => props.active, (val) => {
  if (val && !isLoaded()) {
    load()
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.unread-badge {
  position: absolute;
  top: 12rpx;
  right: -6rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: #fa5151;
  color: #fff;
  font-size: 20rpx;
  line-height: 32rpx;
  text-align: center;
}
</style>
