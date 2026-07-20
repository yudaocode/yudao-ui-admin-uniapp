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
import { onHide, onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { navigateBackPlus } from '@/utils'
import { ImConversationType } from '@/pages-im/utils/constants'
import { buildConversationMessageUrl, getConversationKey } from '@/pages-im/utils/conversation'
import { getGroupDisplayName } from '@/pages-im/utils/user'
import ImTabbar from '../components/im-tabbar.vue'
import { useConversationStore } from '../store/conversationStore'
import { useGroupStore } from '../store/groupStore'
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
const toast = useToast()
const addActions = [ // 新增操作菜单项
  { name: '添加好友', value: 'friend' },
  { name: '创建群聊', value: 'group' },
]
let lastJumpedConversationKey: string | undefined // 上次跳转的未读会话
let createdGroup: { id: number, name?: string, avatar?: string } | undefined // 等待打开的新建群聊
let createdGroupOpening = false // 新建群聊是否正在打开
let createdGroupOpenRequested = false // 打开期间是否收到新的打开请求
let pageVisible = false // 当前页面是否可见

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
  if (item.value === 'group') {
    uni.navigateTo({
      url: '/pages-im/home/contact/group/form/index',
      events: {
        created: handleGroupCreated,
      },
    })
    return
  }
  uni.navigateTo({
    url: '/pages-im/home/contact/friend/apply/index',
  })
}

/** 记录新建群聊，等待表单返回后打开 */
function handleGroupCreated(group: { id: number, name?: string, avatar?: string }) {
  if (group?.id) {
    createdGroup = group
  }
}

/** 跳转新建群聊消息页 */
function navigateToCreatedGroup(groupId: number) {
  return new Promise<void>((resolve, reject) => {
    uni.navigateTo({
      url: buildConversationMessageUrl({
        type: ImConversationType.GROUP,
        targetId: groupId,
      }),
      success: () => resolve(),
      fail: error => reject(error),
    })
  })
}

/** 确保新群会话存在并打开消息页 */
async function openCreatedGroup(runtimeReady: Promise<boolean>) {
  const groupInfo = createdGroup
  if (!groupInfo) {
    return
  }
  if (createdGroupOpening) {
    createdGroupOpenRequested = true
    return
  }
  createdGroupOpening = true
  createdGroupOpenRequested = false
  try {
    if (!await runtimeReady) {
      return
    }
    if (!pageVisible || createdGroup !== groupInfo) {
      return
    }
    const group = useGroupStore().getGroup(groupInfo.id)
    await useConversationStore().ensureConversation({
      type: ImConversationType.GROUP,
      targetId: groupInfo.id,
      name: group ? getGroupDisplayName(group) : groupInfo.name || '新群聊',
      avatar: group?.avatar || groupInfo.avatar || '',
      silent: !!group?.silent,
    })
    if (!pageVisible || createdGroup !== groupInfo) {
      return
    }
    await navigateToCreatedGroup(groupInfo.id)
    if (createdGroup === groupInfo) {
      createdGroup = undefined
    }
  } catch {
    if (pageVisible && createdGroup === groupInfo) {
      toast.error('新群聊打开失败，请稍后重试')
    }
  } finally {
    createdGroupOpening = false
    const shouldOpenLatest = createdGroupOpenRequested && pageVisible && !!createdGroup
    createdGroupOpenRequested = false
    if (shouldOpenLatest) {
      void openCreatedGroup(useImRuntimeStore().ensure())
    }
  }
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
  uni.navigateTo({
    url: buildConversationMessageUrl({
      type: target.type,
      targetId: target.targetId,
      mentionMessageId: target.atMessageId || target.atAllMessageId,
    }),
  })
}

const { nextUnreadJumpNonce } = storeToRefs(useImUiStore())
watch(nextUnreadJumpNonce, openNextUnread)

/** 进入页面时确保 IM 运行时已启动 */
onShow(() => {
  pageVisible = true
  const runtimeReady = useImRuntimeStore().ensure()
  if (createdGroup) {
    void openCreatedGroup(runtimeReady)
  } else {
    void runtimeReady.catch(error => console.warn('[IM conversation] 运行时启动失败', error))
  }
})

/** 页面隐藏时停止异步跳转 */
onHide(() => {
  pageVisible = false
})
</script>
