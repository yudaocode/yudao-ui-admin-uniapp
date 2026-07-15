import type { ConversationDO } from '@/pages-im/utils/db'
import type { Ref } from 'vue'
import type { Message } from '../types'
import { getClientConversationId } from '@/pages-im/utils/db'
import {
  buildMergeMessagePayload,
  removeQuotePayload,
  serializeMessage,
} from '@/pages-im/utils/message'
import { useUserStore } from '@/store/user'
import { ImConversationType, ImMessageType } from '@/pages-im/utils/constants'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { useConversationStore } from '../store/conversationStore'
import { sendMessageToConversation } from './useMessageSender'

/** 管理消息逐条转发、合并转发及新建群聊后续转发 */
export function useMessageForwarder(options: {
  exitSelectMode: () => void
  pageTitle: Readonly<Ref<string>>
}) {
  const toast = useToast()
  const userStore = useUserStore()
  const conversationStore = useConversationStore()
  const forwardVisible = ref(false) // 转发选择弹窗
  const forwardMessages = ref<Message[]>([]) // 待转发消息
  const forwardMerge = ref(false) // 是否合并转发
  const forwardLeaveMessage = ref('') // 转发留言
  let forwardUserId = 0 // 当前转发任务所属用户
  let forwardSourceConversation: ConversationDO | undefined // 打开转发时的源会话快照

  /** 发送一条转发消息到受支持的会话 */
  function sendForwardMessage(
    target: ConversationDO,
    type: number,
    content: string,
    expectedUserId: number,
  ) {
    return sendMessageToConversation(target, type, content, {}, expectedUserId)
  }

  /** 打开转发选择 */
  function openForward(messages: Message[], merge = false) {
    if (messages.length === 0) {
      return
    }
    forwardMessages.value = [...messages]
    forwardMerge.value = merge
    forwardLeaveMessage.value = ''
    forwardUserId = userStore.userInfo.userId
    const activeConversation = conversationStore.activeConversation
    forwardSourceConversation = activeConversation
      ? { ...activeConversation, name: options.pageTitle.value || activeConversation.name }
      : undefined
    forwardVisible.value = true
  }

  /** 打开新建群聊页，创建成功后继续转发 */
  function createGroupAndForward() {
    forwardLeaveMessage.value = ''
    uni.navigateTo({
      url: '/pages-im/home/contact/group/form/index',
      events: {
        created: onForwardGroupCreated,
      },
    })
  }

  /** 接收新建群聊结果并完成转发 */
  async function onForwardGroupCreated(groupInfo: { id: number, name?: string, avatar?: string }) {
    if (!groupInfo?.id || forwardMessages.value.length === 0
      || forwardUserId !== userStore.userInfo.userId) {
      return
    }
    await handleForwardConfirm([{
      clientConversationId: getClientConversationId(ImConversationType.GROUP, groupInfo.id),
      type: ImConversationType.GROUP,
      targetId: groupInfo.id,
      name: groupInfo.name || '新群聊',
      avatar: groupInfo.avatar || '',
      unreadCount: 0,
      lastContent: '',
      lastSendTime: 0,
    }])
  }

  /** 给单个目标发送合并或逐条转发消息 */
  async function forwardToTarget(target: ConversationDO, expectedUserId: number) {
    let success = true
    if (forwardMerge.value) {
      if (!forwardSourceConversation) {
        return false
      }
      const payload = buildMergeMessagePayload(
        forwardMessages.value,
        forwardSourceConversation,
      )
      success = await sendForwardMessage(
        target,
        ImMessageType.MERGE,
        serializeMessage(payload),
        expectedUserId,
      )
    } else {
      for (const message of forwardMessages.value) {
        success = await sendForwardMessage(
          target,
          message.type,
          removeQuotePayload(message.content),
          expectedUserId,
        )
        if (!success) {
          break
        }
      }
    }
    if (!success) {
      return false
    }
    const leaveText = forwardLeaveMessage.value.trim()
    return leaveText
      ? sendForwardMessage(target, ImMessageType.TEXT, leaveText, expectedUserId)
      : true
  }

  /** 确认转发到目标会话 */
  async function handleForwardConfirm(targets: ConversationDO[]) {
    const expectedUserId = forwardUserId || userStore.userInfo.userId
    const isActive = () => expectedUserId > 0 && userStore.userInfo.userId === expectedUserId
    if (!isActive()) {
      return
    }
    const results: Array<{ target: ConversationDO, success: boolean }> = []
    for (const target of targets) {
      if (!isActive()) {
        return
      }
      try {
        results.push({ target, success: await forwardToTarget(target, expectedUserId) })
      } catch {
        results.push({ target, success: false })
      }
    }
    await conversationStore.pushRecentForwardConversationKeyList(
      targets.map(item => item.clientConversationId),
      expectedUserId,
    )
    if (!isActive()) {
      return
    }
    const failedNames = results
      .filter(item => !item.success)
      .map(item => item.target.name || '未命名会话')
    if (failedNames.length === 0) {
      toast.success('已转发')
    } else if (failedNames.length === targets.length) {
      toast.error(`转发失败：${failedNames.join('、')}`)
    } else {
      toast.warning(`已转发，但 ${failedNames.join('、')} 失败`)
    }
    options.exitSelectMode()
    forwardVisible.value = false
    forwardLeaveMessage.value = ''
    forwardUserId = 0
    forwardSourceConversation = undefined
  }

  return {
    forwardVisible,
    forwardLeaveMessage,
    openForward,
    createGroupAndForward,
    handleForwardConfirm,
  }
}
