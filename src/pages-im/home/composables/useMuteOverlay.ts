import type { ComputedRef } from 'vue'
import { computed, onScopeDispose, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { ImConversationType, ImGroupMemberRole } from '@/pages-im/utils/constants'
import { formatDate } from '@/utils/date'
import { toTimestamp } from '@/pages-im/utils/time'
import { isGroupQuit } from '@/pages-im/utils/user'
import { useConversationStore } from '../store/conversationStore'
import { useGroupStore } from '../store/groupStore'

export interface MuteOverlayInfo {
  text: string
  icon: string
}

const sharedNow = ref(Date.now()) // 全部订阅者共享的禁言到期时钟
let sharedTickTimer: ReturnType<typeof setInterval> | undefined
let subscriberCount = 0

/** 订阅禁言到期时钟 */
function subscribeNowTick() {
  subscriberCount++
  sharedTickTimer ||= setInterval(() => {
    sharedNow.value = Date.now()
  }, 30000)
}

/** 取消订阅禁言到期时钟 */
function unsubscribeNowTick() {
  subscriberCount = Math.max(0, subscriberCount - 1)
  if (subscriberCount === 0 && sharedTickTimer) {
    clearInterval(sharedTickTimer)
    sharedTickTimer = undefined
  }
}

/** 当前群会话不可发送状态 */
export function useMuteOverlay(): ComputedRef<MuteOverlayInfo | null> {
  const userStore = useUserStore()
  const conversationStore = useConversationStore()
  const groupStore = useGroupStore()
  subscribeNowTick()
  onScopeDispose(unsubscribeNowTick)

  return computed(() => {
    const conversation = conversationStore.activeConversation
    if (!conversation || conversation.type !== ImConversationType.GROUP) {
      return null
    }
    const group = groupStore.getGroup(conversation.targetId)
    if (!group) {
      return null
    }
    const member = group.members?.find(item => item.userId === userStore.userInfo.userId)
    if (isGroupQuit(group)) {
      return { text: '你已退出群聊，仅可查看历史消息', icon: 'logout' }
    }
    if (group.banned) {
      return { text: '该群已被管理员封禁，无法发送消息', icon: 'warning' }
    }
    const canManage = userStore.userInfo.userId === group.ownerUserId
      || member?.role === ImGroupMemberRole.OWNER
      || member?.role === ImGroupMemberRole.ADMIN
    if (group.mutedAll && group.membersLoaded && !canManage) {
      return { text: '全群禁言中，暂时无法发送消息', icon: 'mic-off' }
    }
    if (member?.muteEndTime && toTimestamp(member.muteEndTime) > sharedNow.value) {
      return {
        text: `你已被禁言至 ${formatDate(member.muteEndTime, 'MM-DD HH:mm')}`,
        icon: 'mic-off',
      }
    }
    return null
  })
}
