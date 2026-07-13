<template>
  <view class="h-full flex flex-col bg-[#f5f5f5]">
    <!-- 搜索 -->
    <view class="conversation-search-wrap">
      <wd-search v-model="keyword" custom-class="conversation-search" placeholder="搜索" hide-cancel />
      <view class="search-add-button" @click="handleAdd">
        <wd-icon name="plus" size="40rpx" color="#333" />
      </view>
    </view>

    <scroll-view
      class="min-h-0 flex-1 bg-white"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="!loading && displayConversations.length === 0" class="py-160rpx">
        <wd-empty icon="message" :tip="keyword ? '无匹配会话' : '暂无会话'" />
      </view>

      <!-- 置顶会话分组 -->
      <view
        v-if="!keyword && topConversations.length"
        class="top-conversation-bar"
        @click="topCollapsed = !topCollapsed"
      >
        <wd-icon name="list" size="34rpx" color="#888" />
        <text class="flex-1">{{ topConversations.length }} 个置顶聊天</text>
        <wd-icon :name="topCollapsed ? 'arrow-down' : 'arrow-up'" size="28rpx" color="#aaa" />
      </view>

      <view
        v-for="item in displayConversations"
        :key="item.clientConversationId"
        class="conversation-row"
        :class="item.top ? 'is-top' : ''"
        @click="openChat(item)"
        @longpress="handleLongPress(item)"
      >
        <view class="relative py-22rpx">
          <ImAvatar :src="item.avatar" :name="item.name" :round="false" size="96rpx" />
          <view v-if="item.unreadCount > 0" class="unread-badge">
            {{ item.unreadCount > 99 ? '99+' : item.unreadCount }}
          </view>
        </view>
        <view class="conversation-content">
          <view class="min-w-0 flex items-center justify-between">
            <text class="conversation-name">{{ item.name || '未命名' }}</text>
            <text class="conversation-time">{{ formatConversationTime(item.lastSendTime) }}</text>
          </view>
          <view class="mt-7rpx flex items-center gap-8rpx">
            <view class="line-clamp-1 min-w-0 flex-1 text-27rpx text-[#999]">
              <text v-if="item.draft?.plain" class="text-[#fa5151]">[草稿] </text>
              <text v-else-if="item.atMe" class="text-[#fa5151]">[有人@我] </text>
              <text v-else-if="item.atAll" class="text-[#fa5151]">[@所有人] </text>{{ item.draft?.plain || item.lastContent || ' ' }}
            </view>
            <wd-icon v-if="item.silent" name="notification-close" size="27rpx" color="#b2b2b2" />
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 会话操作菜单 -->
    <wd-action-sheet v-model="actionVisible" :actions="conversationActions" @select="handleConversationAction" />
  </view>
</template>

<script lang="ts" setup>
import type { ConversationDO } from '@/pages-im/home/db'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref, watch } from 'vue'
import { updateFriend } from '@/api/im/friend'
import { updateGroupMember } from '@/api/im/group/member'
import { formatConversationTime } from '@/pages-im/utils/time'
import { ImConversationType } from '@/utils/constants'
import { useImConversations } from '../../composables/useImConversations'
import ImAvatar from '../../components/im-avatar.vue'

const props = defineProps<{
  active?: boolean
}>()
const emit = defineEmits<{
  add: []
}>()

const { conversations, loading, load, isLoaded, setConversationTop, setConversationSilent, removeConversation } = useImConversations()
const dialog = useDialog()
const refreshing = ref(false) // 下拉刷新状态
const keyword = ref('') // 搜索关键词
const topCollapsed = ref(false) // 是否折叠置顶聊天
const actionVisible = ref(false) // 会话操作菜单显示状态
const actionConversation = ref<ConversationDO>() // 当前操作的会话
const conversationActions = ref<Array<{ name: string, value: 'top' | 'silent' | 'delete', color?: string }>>([]) // 会话操作菜单项

/** 按名称过滤会话 */
const filteredConversations = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) {
    return conversations.value
  }
  return conversations.value.filter(item => (item.name || '').toLowerCase().includes(kw))
})
const topConversations = computed(() => filteredConversations.value.filter(item => item.top)) // 置顶会话
const normalConversations = computed(() => filteredConversations.value.filter(item => !item.top)) // 普通会话
const displayConversations = computed(() => keyword.value
  ? filteredConversations.value
  : [...(topCollapsed.value ? [] : topConversations.value), ...normalConversations.value]) // 当前展示会话

/** 打开新增操作 */
function handleAdd() {
  emit('add')
}

/** 打开会话 */
function openChat(item: ConversationDO) {
  const mentionMessageId = item.atMessageId || item.atAllMessageId
  const query = mentionMessageId ? `&mentionMessageId=${mentionMessageId}` : ''
  uni.navigateTo({
    url: `/pages-im/home/chat/index?type=${item.type}&targetId=${item.targetId}&title=${encodeURIComponent(item.name || '')}${query}`,
  })
}

/** 打开下一条未读会话 */
function openNextUnread() {
  const target = conversations.value.find(item => !item.silent && item.unreadCount > 0)
  if (target) {
    openChat(target)
  }
}

defineExpose({ openNextUnread })

/** 长按会话：置顶 / 免打扰 / 删除 */
function handleLongPress(item: ConversationDO) {
  actionConversation.value = item
  conversationActions.value = [
    { name: item.top ? '取消置顶' : '置顶', value: 'top' },
    { name: item.silent ? '取消免打扰' : '免打扰', value: 'silent' },
    { name: '删除会话', value: 'delete', color: '#fa5151' },
  ]
  actionVisible.value = true
}

/** 处理会话操作 */
async function handleConversationAction({ item: action }: { item: { value: 'top' | 'silent' | 'delete' } }) {
  const item = actionConversation.value
  if (!item) {
    return
  }
  if (action.value === 'top') {
    setConversationTop(item.clientConversationId, !item.top)
  } else if (action.value === 'silent') {
    const silent = !item.silent
    if (item.type === ImConversationType.GROUP) {
      await updateGroupMember({ groupId: item.targetId, silent })
    } else if (item.type === ImConversationType.PRIVATE) {
      await updateFriend({ friendUserId: item.targetId, silent })
    }
    await setConversationSilent(item.clientConversationId, silent)
  } else {
    confirmRemove(item)
  }
}

/** 确认删除会话 */
async function confirmRemove(item: ConversationDO) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定删除该会话吗？' })
  } catch {
    return
  }
  await removeConversation(item.clientConversationId)
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

/** 首次激活时加载一次；之后靠 WebSocket 增量自更新（applyIncomingMessage），从聊天页返回不再全量重拉 */
watch(() => props.active, (val) => {
  if (val && !isLoaded()) {
    load()
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.conversation-search-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background: #ededed;
}

:deep(.conversation-search) {
  min-width: 0;
  flex: 1;
  --wot-search-padding: 0;
  --wot-search-bg: transparent;
  --wot-search-input-bg: #fff;
  --wot-search-cover-bg: #fff;
  --wot-search-input-height: 64rpx;
  --wot-search-input-radius: 10rpx;
  --wot-search-input-font-size: 28rpx;
  --wot-search-placeholder-font-size: 28rpx;
}

.search-add-button {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10rpx;
  background: #fff;

  &:active {
    background: #e2e2e2;
  }
}

.top-conversation-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 22rpx 28rpx;
  border-bottom: 1rpx solid #e5e5e5;
  background: #f7f7f7;
  color: #737373;
  font-size: 28rpx;
}

.conversation-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
  padding-left: 28rpx;
  background: #fff;

  &:active {
    background: #ececec;
  }

  &.is-top {
    background: #f5f5f5;
  }
}

.conversation-content {
  min-width: 0;
  flex: 1;
  padding: 22rpx 28rpx 22rpx 0;
  border-bottom: 1rpx solid #ededed;
}

.conversation-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #191919;
  font-size: 34rpx;
  font-weight: 400;
  line-height: 44rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-time {
  flex-shrink: 0;
  margin-left: 16rpx;
  color: #b2b2b2;
  font-size: 23rpx;
  line-height: 34rpx;
}

.unread-badge {
  position: absolute;
  top: 13rpx;
  right: -8rpx;
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 7rpx;
  border: 2rpx solid #fff;
  border-radius: 18rpx;
  background: #fa5151;
  color: #fff;
  font-size: 20rpx;
  line-height: 30rpx;
  text-align: center;
  box-sizing: border-box;
}
</style>
