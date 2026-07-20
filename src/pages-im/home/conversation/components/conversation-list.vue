<template>
  <view class="h-full flex flex-col bg-[#f5f5f5]">
    <!-- 搜索 -->
    <view class="conversation-search-wrap">
      <wd-search
        v-model="keyword"
        variant="filled"
        custom-class="conversation-search"
        placeholder="搜索"
        hide-cancel
      />
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
        v-if="showTopToggle"
        class="top-conversation-bar"
        @click="toggleTopCollapsed"
      >
        <wd-icon name="list" size="34rpx" color="#888" />
        <text class="flex-1">
          {{ topCollapsed ? `${hiddenTopConversationCount} 个置顶聊天` : '折叠置顶聊天' }}
        </text>
        <wd-icon :name="topCollapsed ? 'arrow-down' : 'arrow-up'" size="28rpx" color="#aaa" />
      </view>

      <ConversationItem
        v-for="item in displayConversations"
        :key="item.clientConversationId"
        :conversation="item"
        @longpress="handleLongPress(item)"
      />
    </scroll-view>

    <!-- 会话操作菜单 -->
    <wd-action-sheet v-model="actionVisible" :actions="conversationActions" @select="handleConversationAction" />
  </view>
</template>

<script lang="ts" setup>
import type { ConversationDO } from '@/pages-im/utils/db'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { filterConversationsByKeyword } from '@/pages-im/utils/conversation'
import { StorageKeys } from '@/pages-im/utils/db'
import { ImConversationType } from '@/pages-im/utils/constants'
import { useConversationStore } from '../../store/conversationStore'
import { useFriendStore } from '../../store/friendStore'
import { useGroupStore } from '../../store/groupStore'
import { useImRuntimeStore } from '../../store/runtimeStore'
import ConversationItem from './conversation-item.vue'

const emit = defineEmits<{
  add: []
}>()

const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const { conversations, loading } = storeToRefs(conversationStore)
const { loadConversationList, setConversationTop, removeConversation } = conversationStore
const dialog = useDialog()
const PINNED_FOLD_THRESHOLD = 3 // 置顶会话达到该数量后进入折叠模式
const refreshing = ref(false) // 下拉刷新状态
const keyword = ref('') // 搜索关键词
const topCollapsed = ref(uni.getStorageSync(StorageKeys.localStorage.conversationPinnedExpanded) !== true) // 是否折叠置顶聊天
const actionVisible = ref(false) // 会话操作菜单显示状态
const actionConversation = ref<ConversationDO>() // 当前操作的会话
const conversationActions = ref<Array<{ name: string, value: 'top' | 'silent' | 'delete', color?: string }>>([]) // 会话操作菜单项

/** 按名称过滤会话 */
const filteredConversations = computed(() => {
  return filterConversationsByKeyword(conversations.value, keyword.value)
})
const topConversations = computed(() => filteredConversations.value.filter(item => item.top)) // 置顶会话
const normalConversations = computed(() => filteredConversations.value.filter(item => !item.top)) // 普通会话
const visibleTopConversations = computed(() => topConversations.value.filter(item => !item.silent
  && item.unreadCount > 0)) // 折叠后仍显示的未读置顶会话
const showTopSection = computed(() => !keyword.value.trim()
  && topConversations.value.length >= PINNED_FOLD_THRESHOLD) // 是否显示置顶折叠区
const hiddenTopConversationCount = computed(() =>
  Math.max(0, topConversations.value.length - visibleTopConversations.value.length)) // 折叠后隐藏的置顶会话数
const showTopToggle = computed(() => showTopSection.value
  && (hiddenTopConversationCount.value > 0 || !topCollapsed.value)) // 是否显示置顶折叠按钮
const displayConversations = computed(() => {
  if (keyword.value.trim() || !showTopSection.value || !topCollapsed.value) {
    return filteredConversations.value
  }
  return [...visibleTopConversations.value, ...normalConversations.value]
}) // 当前展示会话

/** 打开新增操作 */
function handleAdd() {
  emit('add')
}

/** 切换并保存置顶会话折叠状态 */
function toggleTopCollapsed() {
  topCollapsed.value = !topCollapsed.value
  uni.setStorageSync(StorageKeys.localStorage.conversationPinnedExpanded, !topCollapsed.value)
}

/** 长按会话：置顶 / 免打扰 / 删除 */
function handleLongPress(item: ConversationDO) {
  actionConversation.value = item
  const actions: typeof conversationActions.value = [
    { name: item.top ? '取消置顶' : '置顶', value: 'top' },
    { name: '删除会话', value: 'delete', color: '#fa5151' },
  ]
  if (item.type !== ImConversationType.CHANNEL) {
    actions.splice(1, 0, { name: item.silent ? '取消免打扰' : '免打扰', value: 'silent' })
  }
  conversationActions.value = actions
  actionVisible.value = true
}

/** 处理会话操作 */
async function handleConversationAction({ item: action }: { item: { value: 'top' | 'silent' | 'delete' } }) {
  const item = actionConversation.value
  if (!item) {
    return
  }
  if (action.value === 'top') {
    await setConversationTop(item.type, item.targetId, !item.top)
  } else if (action.value === 'silent') {
    const silent = !item.silent
    if (item.type === ImConversationType.GROUP) {
      await groupStore.setGroupSilent(item.targetId, silent)
    } else if (item.type === ImConversationType.PRIVATE) {
      await friendStore.setFriendSilent(item.targetId, silent)
    }
  } else {
    await confirmRemove(item)
  }
}

/** 确认删除会话 */
async function confirmRemove(item: ConversationDO) {
  const { type, targetId } = item
  try {
    await dialog.confirm({ title: '提示', msg: '确定删除该会话吗？' })
  } catch {
    return
  }
  await removeConversation(type, targetId)
}

/** 下拉刷新 */
async function onRefresh() {
  refreshing.value = true
  try {
    if (!await useImRuntimeStore().ensure()) {
      return
    }
    await loadConversationList(true)
  } catch (error) {
    console.warn('[IM conversation list] 刷新失败', error)
  } finally {
    refreshing.value = false
  }
}
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
  --wot-search-cover-bg: transparent;
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
</style>
