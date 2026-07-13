import type { ConversationDO } from '@/pages-im/home/db/types'
import type { ImMergeMessage } from '@/pages-im/utils/message'
import type { Ref } from 'vue'
import type { ChatMessage } from '../types'
import { sendGroupMessage } from '@/api/im/message/group'
import { sendPrivateMessage } from '@/api/im/message/private'
import { getClientConversationId } from '@/pages-im/home/db'
import { generateClientMessageId, removeQuotePayload, serializeMessage } from '@/pages-im/utils/message'
import { useUserStore } from '@/store/user'
import { ImConversationType, ImMessageType } from '@/utils/constants'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'

/** 管理消息逐条转发、合并转发及新建群聊后续转发 */
export function useMessageForwarder(options: {
  getSelectedMessages: () => ChatMessage[]
  getMessageSenderName: (message: ChatMessage) => string
  exitSelectMode: () => void
  pageTitle: Readonly<Ref<string>>
}) {
  const toast = useToast()
  const userStore = useUserStore()
  const forwardVisible = ref(false) // 转发选择弹窗
  const forwardMessages = ref<ChatMessage[]>([]) // 待转发消息
  const forwardMerge = ref(false) // 是否合并转发
  const forwardActionVisible = ref(false) // 转发方式菜单显示状态
  const forwardActions = [ // 转发方式菜单项
    { name: '逐条转发', value: 'single' },
    { name: '合并转发', value: 'merge' },
  ]

  /** 发送一条转发消息到受支持的会话 */
  function sendForwardMessage(target: ConversationDO, type: number, content: string) {
    if (target.type === ImConversationType.GROUP) {
      return sendGroupMessage({
        clientMessageId: generateClientMessageId(),
        groupId: target.targetId,
        type,
        content,
      })
    }
    if (target.type === ImConversationType.PRIVATE) {
      return sendPrivateMessage({
        clientMessageId: generateClientMessageId(),
        receiverId: target.targetId,
        type,
        content,
      })
    }
    return Promise.reject(new Error('该会话不支持转发'))
  }

  /** 打开转发选择 */
  function openForward(messages: ChatMessage[], merge = false) {
    if (messages.length === 0) {
      return
    }
    forwardMessages.value = [...messages]
    forwardMerge.value = merge
    forwardVisible.value = true
  }

  /** 转发当前选中的消息 */
  function forwardSelected() {
    const messages = options.getSelectedMessages()
    if (messages.length <= 1) {
      openForward(messages)
      return
    }
    forwardActionVisible.value = true
  }

  /** 处理转发方式 */
  function handleForwardAction({ item }: { item: { value: string } }) {
    openForward(options.getSelectedMessages(), item.value === 'merge')
  }

  /** 打开新建群聊页，创建成功后继续转发 */
  function createGroupAndForward() {
    uni.navigateTo({ url: '/pages-im/home/group/form/index?forward=1' })
  }

  /** 接收新建群聊结果并完成转发 */
  async function onForwardGroupCreated(groupInfo: { id: number, name?: string, avatar?: string }) {
    if (!groupInfo?.id || forwardMessages.value.length === 0) {
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

  /** 确认转发到目标会话 */
  async function handleForwardConfirm(targets: ConversationDO[]) {
    if (forwardMerge.value) {
      const payload: ImMergeMessage = {
        title: `${options.pageTitle.value}的聊天记录`,
        messages: forwardMessages.value.map(message => ({
          senderNickname: message.senderId === userStore.userInfo.userId
            ? userStore.userInfo.nickname
            : options.getMessageSenderName(message),
          type: message.type,
          content: removeQuotePayload(message.content),
        })),
      }
      const content = serializeMessage(payload)
      for (const target of targets) {
        await sendForwardMessage(target, ImMessageType.MERGE, content)
      }
      toast.success('转发成功')
      options.exitSelectMode()
      return
    }
    for (const target of targets) {
      for (const message of forwardMessages.value) {
        const content = removeQuotePayload(message.content)
        await sendForwardMessage(target, message.type, content)
      }
    }
    toast.success('转发成功')
    options.exitSelectMode()
  }

  return {
    forwardVisible,
    forwardActionVisible,
    forwardActions,
    openForward,
    forwardSelected,
    handleForwardAction,
    createGroupAndForward,
    onForwardGroupCreated,
    handleForwardConfirm,
  }
}
