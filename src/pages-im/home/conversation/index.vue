<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 会话列表 -->
    <view class="min-h-0 flex-1">
      <ConversationList @add="handleAdd" />
    </view>

    <!-- 底部导航栏 -->
    <ImTabbar active="conversation" />

    <!-- 新增操作菜单 -->
    <wd-action-sheet v-model="addActionVisible" :actions="addActions" @select="handleAddAction" />
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { navigateBackPlus } from '@/utils'
import { getConversationKey } from '@/pages-im/utils/conversation'
import ImTabbar from '../components/im-tabbar.vue'
import { useConversationStore } from '../store/conversationStore'
import { useImRuntimeStore } from '../store/runtimeStore'
import { useImUiStore } from '../store/uiStore'
import ConversationList from './components/conversation-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const addActionVisible = ref(false) // 新增操作菜单显示状态
const addActions = [ // 新增操作菜单项
  { name: '添加好友', value: 'friend' },
  { name: '创建群聊', value: 'group' },
]
let lastJumpedConversationKey: string | undefined // 上次跳转的未读会话

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/index/index')
}

/** 打开新增操作 */
function handleAdd() {
  addActionVisible.value = true
}

/** 处理新增操作 */
function handleAddAction({ item }: { item: { value: string } }) {
  uni.navigateTo({
    url: item.value === 'friend'
      ? '/pages-im/home/contact/friend/apply/index'
      : '/pages-im/home/contact/group/form/index',
  })
}

/** 再次点击消息入口时进入下一条未读会话 */
function openNextUnread() {
  const unreadList = useConversationStore().conversations.filter(item => item.unreadCount > 0)
  if (unreadList.length === 0) {
    return
  }
  const previousIndex = lastJumpedConversationKey
    ? unreadList.findIndex(item => getConversationKey(item) === lastJumpedConversationKey)
    : -1
  const target = unreadList[(previousIndex + 1) % unreadList.length]
  lastJumpedConversationKey = getConversationKey(target)
  const mentionMessageId = target.atMessageId || target.atAllMessageId
  const query = mentionMessageId ? `&mentionMessageId=${mentionMessageId}` : ''
  // TODO @AI：这里为什么通过 name 获取？
  uni.navigateTo({
    url: `/pages-im/home/conversation/message/index?type=${target.type}&targetId=${target.targetId}&title=${encodeURIComponent(target.name || '')}${query}`,
  })
}

const { nextUnreadJumpNonce } = storeToRefs(useImUiStore())
watch(nextUnreadJumpNonce, openNextUnread)

/** 进入页面时确保 IM 运行时已启动 */
onShow(() => {
  void useImRuntimeStore().ensure()
})
</script>
