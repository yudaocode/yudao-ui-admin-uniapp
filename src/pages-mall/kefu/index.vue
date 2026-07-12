<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客服会话"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 会话列表 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view v-if="sortedConversations.length">
        <view
          v-for="item in sortedConversations"
          :key="item.id"
          class="flex items-center gap-20rpx border-b border-[#f5f5f5] px-24rpx py-24rpx active:bg-[#f7f8fa]"
          :class="item.adminPinned ? 'bg-[#f7f8fa]' : 'bg-white'"
          @click="handleOpen(item)"
          @longpress="handleLongPress(item)"
        >
          <!-- 头像 + 未读角标 -->
          <view class="relative shrink-0">
            <wd-img
              v-if="item.userAvatar"
              :src="item.userAvatar"
              width="88rpx" height="88rpx" radius="44rpx" mode="aspectFill"
            />
            <view v-else class="h-88rpx w-88rpx flex items-center justify-center rounded-full bg-[#e6f4ff]">
              <wd-icon name="user" size="44rpx" color="#1677ff" />
            </view>
            <view
              v-if="item.adminUnreadMessageCount"
              class="absolute min-w-32rpx rounded-16rpx bg-[#fa4350] px-8rpx text-center text-20rpx text-white leading-32rpx -right-8rpx -top-8rpx"
            >
              {{ item.adminUnreadMessageCount > 99 ? '99+' : item.adminUnreadMessageCount }}
            </view>
          </view>
          <!-- 昵称 + 最后消息 + 时间 -->
          <view class="min-w-0 flex-1">
            <view class="flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex items-center gap-8rpx">
                <text v-if="item.adminPinned" class="shrink-0 rounded-4rpx bg-[#fff1f0] px-8rpx text-20rpx text-[#fa4350] leading-32rpx">
                  置顶
                </text>
                <text class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.userNickname || `用户 ${item.userId}` }}
                </text>
              </view>
              <text class="shrink-0 text-22rpx text-[#999]">
                {{ formatChatTime(item.lastMessageTime) }}
              </text>
            </view>
            <text class="line-clamp-1 mt-8rpx text-26rpx text-[#999]">
              {{ kefuLastMessagePreview(item.lastMessageContent, item.lastMessageContentType) }}
            </text>
          </view>
        </view>
      </view>
      <wd-empty v-else icon="message" tip="暂无会话" />
    </scroll-view>

    <!-- 会话操作菜单 -->
    <wd-action-sheet v-model="actionVisible" :actions="conversationActions" @select="handleConversationAction" />
  </view>
</template>

<script lang="ts" setup>
import type { PromotionKefuConversation } from '@/api/mall/promotion/kefu/conversation'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  deletePromotionKefuConversation,
  getPromotionKefuConversationList,
  updatePromotionKefuConversationPinned,
} from '@/api/mall/promotion/kefu/conversation'
import { navigateBackPlus } from '@/utils'
import { formatChatTime } from '@/utils/date'
import { connectKefuWebSocket, disconnectKefuWebSocket } from './composables/useKefuWebSocket'
import { kefuLastMessagePreview } from './composables/message'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const conversations = ref<PromotionKefuConversation[]>([]) // 会话列表
const actionVisible = ref(false) // 会话操作菜单显示状态
const actionConversation = ref<PromotionKefuConversation>() // 当前操作的会话
const conversationActions = ref<Array<{ name: string, value: 'pin' | 'delete', color?: string }>>([]) // 会话操作菜单项
const sortedConversations = computed(() => [...conversations.value].sort((a, b) => {
  if (!!a.adminPinned !== !!b.adminPinned) {
    return a.adminPinned ? -1 : 1
  }
  return (b.lastMessageTime || '').localeCompare(a.lastMessageTime || '')
})) // 置顶优先 + 最近消息时间倒序

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载会话列表 */
async function loadConversations() {
  conversations.value = await getPromotionKefuConversationList()
}

/** 长按会话：置顶 / 删除 */
function handleLongPress(item: PromotionKefuConversation) {
  actionConversation.value = item
  conversationActions.value = [
    { name: item.adminPinned ? '取消置顶' : '置顶', value: 'pin' },
    { name: '删除会话', value: 'delete', color: '#fa5151' },
  ]
  actionVisible.value = true
}

/** 处理会话操作 */
function handleConversationAction({ item }: { item: { value: 'pin' | 'delete' } }) {
  if (!actionConversation.value) {
    return
  }
  if (item.value === 'pin') {
    togglePin(actionConversation.value)
  } else {
    confirmDelete(actionConversation.value)
  }
}

/** 切换会话置顶状态 */
async function togglePin(item: PromotionKefuConversation) {
  await updatePromotionKefuConversationPinned({ id: item.id, adminPinned: !item.adminPinned })
  toast.success(item.adminPinned ? '已取消置顶' : '已置顶')
  await loadConversations()
}

/** 删除会话（二次确认） */
function confirmDelete(item: PromotionKefuConversation) {
  uni.showModal({
    title: '提示',
    content: '确定删除该会话吗？',
    success: async ({ confirm }) => {
      if (!confirm) {
        return
      }
      await deletePromotionKefuConversation(item.id!)
      toast.success('删除成功')
      await loadConversations()
    },
  })
}

/** 打开会话详情 */
function handleOpen(item: PromotionKefuConversation) {
  const query = [
    `id=${item.id}`,
    item.userId != null ? `userId=${item.userId}` : '',
    item.userNickname ? `nickname=${encodeURIComponent(item.userNickname)}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-mall/kefu/chat/index?${query}` })
}

/** 收到新消息 / 已读回执：刷新会话列表 */
function handleWsRefresh() {
  loadConversations()
}

/** 初始化：加载会话 + 建立 WebSocket + 监听 */
onMounted(() => {
  loadConversations()
  connectKefuWebSocket()
  uni.$on('mall:kefu:message', handleWsRefresh)
  uni.$on('mall:kefu:read', handleWsRefresh)
})

/** 卸载：断开 WebSocket 与移除监听 */
function cleanup() {
  uni.$off('mall:kefu:message', handleWsRefresh)
  uni.$off('mall:kefu:read', handleWsRefresh)
  disconnectKefuWebSocket()
}

onUnmounted(cleanup)
onUnload(cleanup)
</script>
