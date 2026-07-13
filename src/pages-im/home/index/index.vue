<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="currentTab.title"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 内容区：消息 / 通讯录 两个视图常驻 -->
    <view class="min-h-0 flex-1">
      <ConversationView
        v-show="activeTab === 'message'"
        ref="conversationRef"
        :active="activeTab === 'message'"
        @add="handleAdd"
      />
      <FriendView v-show="activeTab === 'contact'" :active="activeTab === 'contact'" @add="handleAdd" />
    </view>

    <!-- 底部 tab 栏 -->
    <wd-tabbar
      v-model="activeTab"
      :active-color="activeColor"
      inactive-color="#8a8a8a"
      safe-area-inset-bottom
      bordered
    >
      <wd-tabbar-item
        v-for="tab in tabs"
        :key="tab.key"
        :name="tab.key"
        :title="tab.title"
        :icon="tab.icon"
        :value="tab.key === 'message' ? messageBadge : contactBadge"
        @click="handleTabClick(tab.key)"
      />
    </wd-tabbar>

    <!-- 新增操作菜单 -->
    <wd-action-sheet v-model="addActionVisible" :actions="addActions" @select="handleAddAction" />
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getMyFriendRequestList } from '@/api/im/friend/request'
import { getUnhandledRequestList } from '@/api/im/group/request'
import { ImFriendRequestHandleResult } from '@/utils/constants'
import { navigateBackPlus } from '@/utils'
import { useUserStore } from '@/store/user'
import { useImConversations } from '../composables/useImConversations'
import { connectImWebSocket } from '../composables/useImWebSocket'
import ConversationView from './components/conversation-view.vue'
import FriendView from './components/friend-view.vue'

type TabKey = 'message' | 'contact'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const activeColor = '#1677ff' // 选中色
const tabs: { key: TabKey, title: string, icon: string }[] = [
  { key: 'message', title: '消息', icon: 'message' },
  { key: 'contact', title: '通讯录', icon: 'user' },
] // 底部 tab 配置
const activeTab = ref<TabKey>('message') // 当前 tab
const conversationRef = ref<InstanceType<typeof ConversationView>>() // 会话列表组件
const contactUnread = ref(0) // 待处理通讯录申请数
const addActionVisible = ref(false) // 新增操作菜单显示状态
const addActions = [ // 新增操作菜单项
  { name: '添加好友', value: 'friend' },
  { name: '创建群聊', value: 'group' },
]
const userStore = useUserStore()

const { conversations } = useImConversations()

/** 当前 tab 信息 */
const currentTab = computed(() => tabs.find(tab => tab.key === activeTab.value) || tabs[0])

/** 未读总数 */
const totalUnread = computed(() => conversations.value.reduce((sum, item) => sum + (item.silent ? 0 : item.unreadCount || 0), 0))

/** 消息 tab 徽标（无未读时不展示） */
const messageBadge = computed<number | string | undefined>(() => {
  if (totalUnread.value <= 0) {
    return undefined
  }
  return totalUnread.value > 99 ? '99+' : totalUnread.value
})

/** 通讯录申请徽标 */
const contactBadge = computed<number | string | undefined>(() => {
  if (contactUnread.value <= 0) {
    return undefined
  }
  return contactUnread.value > 99 ? '99+' : contactUnread.value
})

/** 刷新好友与加群申请数 */
async function loadContactUnread() {
  const [friendRequests, groupRequests] = await Promise.all([getMyFriendRequestList(50), getUnhandledRequestList()])
  contactUnread.value = friendRequests.filter(item => item.handleResult === ImFriendRequestHandleResult.UNHANDLED).length
    + groupRequests.length
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/index/index')
}

/** 右上角新增：添加好友 / 创建群聊 */
function handleAdd() {
  addActionVisible.value = true
}

/** 处理新增操作 */
function handleAddAction({ item }: { item: { value: string } }) {
  uni.navigateTo({
    url: item.value === 'friend' ? '/pages-im/home/friend/apply/index' : '/pages-im/home/group/form/index',
  })
}

/** 再次点击消息入口时进入下一条未读会话 */
function handleTabClick(tab: TabKey) {
  if (tab === 'message' && activeTab.value === 'message') {
    conversationRef.value?.openNextUnread()
  }
}

// #ifdef H5
const defaultDocumentTitle = document.title // 默认浏览器标题
watch(totalUnread, (count) => {
  document.title = count > 0 ? `(${count > 99 ? '99+' : count}) ${defaultDocumentTitle}` : defaultDocumentTitle
}, { immediate: true })

onUnmounted(() => {
  document.title = defaultDocumentTitle
})
// #endif

/** 进入 IM 即建立实时连接（幂等） */
onShow(() => {
  if (!userStore.userInfo.userId) {
    return
  }
  connectImWebSocket()
  loadContactUnread()
})

/** 订阅申请实时变化 */
onMounted(() => uni.$on('im:requests:reload', loadContactUnread))

/** 释放申请刷新订阅 */
onUnmounted(() => uni.$off('im:requests:reload', loadContactUnread))
</script>
