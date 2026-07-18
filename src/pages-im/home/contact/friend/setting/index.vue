<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="聊天设置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <!-- 私聊设置 -->
    <ConversationPrivateSide
      :friend-user-id="friendUserId"
      :active="active"
      @history="openHistory"
      @create-group="createGroup"
    />
  </view>
</template>

<script lang="ts" setup>
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { ImConversationType } from '@/pages-im/utils/constants'
import { buildConversationMessageUrl } from '@/pages-im/utils/conversation'
import { navigateBackPlus } from '@/utils'
import { useUserStore } from '@/store/user'
import { useConversationStore } from '../../../store/conversationStore'
import { useGroupStore } from '../../../store/groupStore'
import { useImRuntimeStore } from '../../../store/runtimeStore'
import ConversationPrivateSide from '../../../conversation/components/conversation-private-side.vue'

const props = defineProps<{
  friendUserId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const active = ref(true) // 页面是否显示
const toast = useToast()
const userStore = useUserStore()
let pendingCreatedGroup: { groupId: number, accountId: number, friendUserId: number } | undefined
let openingCreatedGroup = false

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
}

/** 查找聊天内容 */
function openHistory(friendUserId: number, displayName: string) {
  uni.navigateTo({
    url: `/pages-im/home/conversation/history/index?type=${ImConversationType.PRIVATE}&targetId=${friendUserId}&title=${encodeURIComponent(displayName)}`,
  })
}

/** 与当前好友创建群聊 */
function createGroup(friendUserId: number) {
  const accountId = userStore.userInfo.userId
  pendingCreatedGroup = undefined
  uni.navigateTo({
    url: `/pages-im/home/contact/group/form/index?memberUserIds=${friendUserId}`,
    events: {
      created: (group: { id: number }) => {
        if (group.id
          && userStore.userInfo.userId === accountId
          && Number(props.friendUserId) === friendUserId) {
          pendingCreatedGroup = { groupId: group.id, accountId, friendUserId }
        }
      },
    },
  })
}

/** 创建成功后打开群聊 */
async function openCreatedGroup() {
  const context = pendingCreatedGroup
  if (!context || openingCreatedGroup) {
    return
  }
  const isContextActive = () => active.value
    && userStore.userInfo.userId === context.accountId
    && Number(props.friendUserId) === context.friendUserId
    && pendingCreatedGroup === context
  if (!isContextActive()) {
    pendingCreatedGroup = undefined
    return
  }
  openingCreatedGroup = true
  try {
    await useImRuntimeStore().ensure()
    if (!isContextActive()) {
      return
    }
    const group = await useGroupStore().fetchGroupInfo(context.groupId, true)
    if (!isContextActive()) {
      return
    }
    if (!group) {
      toast.show('暂时无法打开新群聊，返回本页后将自动重试')
      return
    }
    await useConversationStore().ensureConversation({
      type: ImConversationType.GROUP,
      targetId: context.groupId,
      name: group.name,
      avatar: group.avatar || '',
      silent: group.silent,
    })
    if (!isContextActive()) {
      return
    }
    await new Promise<void>((resolve, reject) => {
      uni.navigateTo({
        url: buildConversationMessageUrl({ type: ImConversationType.GROUP, targetId: context.groupId }),
        success: () => resolve(),
        fail: error => reject(error),
      })
    })
    if (pendingCreatedGroup === context
      && userStore.userInfo.userId === context.accountId
      && Number(props.friendUserId) === context.friendUserId) {
      pendingCreatedGroup = undefined
    }
  } catch {
    if (isContextActive()) {
      toast.show('暂时无法打开新群聊，返回本页后将自动重试')
    }
  } finally {
    openingCreatedGroup = false
  }
}

onShow(() => {
  active.value = true
  void openCreatedGroup()
})

onHide(() => {
  active.value = false
})

onUnload(() => {
  active.value = false
})
</script>
