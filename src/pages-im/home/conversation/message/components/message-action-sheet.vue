<template>
  <wd-action-sheet v-model="visible" :actions="actions" @select="handleSelect" />
  <GroupMemberMutePicker
    ref="mutePickerRef"
    :group-id="group?.id || 0"
    @success="emit('reload-group-members')"
  />
</template>

<script lang="ts" setup>
import type { GroupMember, Message } from '../../../types'
import type { FileMessage, TextMessage } from '@/pages-im/utils/message'
import { computed, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { cancelMuteMember, pinGroupMessage } from '@/api/im/group'
import { removeGroupMember } from '@/api/im/group/member'
import {
  CommonStatusEnum,
  ImConversationType,
  ImGroupMemberRole,
  ImMessageType,
} from '@/pages-im/utils/constants'
import {
  canForwardMessage,
  canRecallMessage,
  extractAddableFace,
  parseMessage,
} from '@/pages-im/utils/message'
import { toTimestamp } from '@/pages-im/utils/time'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import { useUserStore } from '@/store/user'
import { useMediaUploader } from '../../../composables/useMediaUploader'
import { useFaceStore } from '../../../store/faceStore'
import { useGroupStore } from '../../../store/groupStore'
import GroupMemberMutePicker from '../../../contact/group/components/group-member-mute-picker.vue'

interface MessageAction {
  name: string
  value: string
  color?: string
}

const props = defineProps<{
  conversationType: number // 会话类型
  targetId: number // 会话目标编号
  groupMembers: GroupMember[] // 当前群成员
  recallMessage: (message: Message) => Promise<boolean> // 撤回消息
}>()

const emit = defineEmits<{
  'reply': [message: Message] // 引用回复
  'forward': [messages: Message[]] // 转发消息
  'enter-select': [message: Message] // 进入多选
  'delete': [messages: Message[]] // 删除消息
  'recalled': [messageId: number] // 消息已撤回
  'reload-group-members': [] // 刷新群成员
  'reload-group-state': [] // 刷新群资料
}>()

const toast = useToast()
const dialog = useDialog()
const userStore = useUserStore()
const faceStore = useFaceStore()
const groupStore = useGroupStore()
const { getLocalImageInfo } = useMediaUploader()
const visible = ref(false) // 操作菜单显示状态
const message = ref<Message>() // 当前操作消息
const actions = ref<MessageAction[]>([]) // 当前操作菜单项
const pinningMessageId = ref<number>() // 正在置顶的消息编号
const mutePickerRef = ref<InstanceType<typeof GroupMemberMutePicker>>() // 禁言时长选择器引用
const group = computed(() => groupStore.getGroup(props.targetId)) // 当前群资料
const currentGroupMember = computed(() => props.groupMembers.find(
  item => item.userId === userStore.userInfo.userId,
)) // 当前群成员
const canManageGroup = computed(() => currentGroupMember.value?.role === ImGroupMemberRole.OWNER
  || currentGroupMember.value?.role === ImGroupMemberRole.ADMIN) // 是否可管理群聊
const isChannel = computed(() => props.conversationType === ImConversationType.CHANNEL) // 是否频道会话

/** 获取当前用户可管理的消息发送成员 */
function getManageableSender(item: Message) {
  if (props.conversationType !== ImConversationType.GROUP
    || item.senderId === userStore.userInfo.userId
    || !currentGroupMember.value) {
    return undefined
  }
  const sender = props.groupMembers.find(member => member.userId === item.senderId
    && member.status !== CommonStatusEnum.DISABLE)
  if (!sender?.role || !currentGroupMember.value.role || currentGroupMember.value.role >= sender.role) {
    return undefined
  }
  return sender
}

/** 是否为群置顶消息 */
function isPinnedMessage(messageId: number) {
  return !!group.value?.pinnedMessages?.some(item => item.id === messageId)
}

/** 打开消息操作菜单 */
function open(item: Message) {
  const menu: MessageAction[] = []
  const canForward = canForwardMessage(item)
  if (!isChannel.value && canForward && item.type !== ImMessageType.MERGE) {
    menu.push({ name: '引用', value: 'reply' })
  }
  if (!isChannel.value && item.type === ImMessageType.TEXT) {
    menu.push({ name: '复制', value: 'copy' })
  }
  if (canForward) {
    menu.push({ name: '转发', value: 'forward' })
  }
  if (canRecallMessage(item, props.conversationType, userStore.userInfo.userId)) {
    menu.push({ name: '撤回', value: 'recall' })
  }
  if (props.conversationType === ImConversationType.GROUP
    && canManageGroup.value
    && canForward
    && !isPinnedMessage(item.id)) {
    menu.push({ name: '置顶', value: 'pin' })
  }
  if (!isChannel.value && item.type === ImMessageType.FILE) {
    menu.push({ name: '复制文件链接', value: 'copyFileUrl' })
  }
  if (!isChannel.value
    && canForward
    && (item.type === ImMessageType.IMAGE || item.type === ImMessageType.FACE)) {
    menu.push({ name: '添加到表情', value: 'addFace' })
  }
  const senderMember = getManageableSender(item)
  if (senderMember) {
    if (toTimestamp(senderMember.muteEndTime) > Date.now()) {
      menu.push({ name: '解除禁言', value: 'unmuteSender' })
    } else {
      menu.push({ name: '设置禁言', value: 'muteSender' })
    }
    menu.push({ name: '移出群聊', value: 'removeSender', color: '#fa5151' })
  }
  if (!isChannel.value && canForward) {
    menu.push({ name: '多选', value: 'multiSelect' })
  }
  if (!canRecallMessage(item, props.conversationType, userStore.userInfo.userId)) {
    menu.push({ name: '删除', value: 'delete', color: '#fa5151' })
  }
  if (menu.length === 0) {
    return
  }
  message.value = item
  actions.value = menu
  visible.value = true
}

/** 处理消息菜单操作 */
async function handleSelect({ item }: { item: MessageAction }) {
  const current = message.value
  if (!current) {
    return
  }
  if (item.value === 'reply') {
    emit('reply', current)
  } else if (item.value === 'copy') {
    const content = parseMessage<TextMessage>(current.content)?.content || current.content || ''
    uni.setClipboardData({ data: content })
  } else if (item.value === 'copyFileUrl') {
    const file = parseMessage<FileMessage>(current.content)
    if (file?.url) {
      uni.setClipboardData({ data: file.url })
    }
  } else if (item.value === 'addFace') {
    await addFace(current)
  } else if (item.value === 'muteSender') {
    const sender = getManageableSender(current)
    if (sender) {
      mutePickerRef.value?.open(sender)
    }
  } else if (item.value === 'unmuteSender') {
    await unmuteSender(current)
  } else if (item.value === 'removeSender') {
    await removeSender(current)
  } else if (item.value === 'recall') {
    await recall(current)
  } else if (item.value === 'pin') {
    await pinMessage(current)
  } else if (item.value === 'forward') {
    emit('forward', [current])
  } else if (item.value === 'multiSelect') {
    emit('enter-select', current)
  } else if (item.value === 'delete') {
    emit('delete', [current])
  }
}

/** 将图片或表情消息添加到个人收藏 */
async function addFace(item: Message) {
  const payload = extractAddableFace(item)
  if (!payload?.url) {
    return
  }
  const imageInfo = payload.width && payload.height ? undefined : await getLocalImageInfo(payload.url)
  if (await faceStore.addFaceUserItem({
    url: payload.url,
    name: payload.name,
    width: payload.width || imageInfo?.width || 0,
    height: payload.height || imageInfo?.height || 0,
  })) {
    toast.success('已添加到表情')
  }
}

/** 解除消息发送成员的禁言 */
async function unmuteSender(item: Message) {
  if (!group.value?.id || !getManageableSender(item)) {
    return
  }
  try {
    await dialog.confirm({ title: '解除禁言', msg: '确定解除该成员的禁言吗？' })
  } catch {
    return
  }
  await cancelMuteMember({ id: group.value.id, userId: item.senderId })
  toast.success('已解除禁言')
  emit('reload-group-members')
}

/** 将消息发送成员移出群聊 */
async function removeSender(item: Message) {
  const sender = getManageableSender(item)
  if (!group.value?.id || !sender) {
    return
  }
  try {
    await dialog.confirm({ title: '移出群聊', msg: `确定将“${getMemberDisplayName(sender)}”移出群聊吗？` })
  } catch {
    return
  }
  await removeGroupMember({ groupId: group.value.id, memberUserIds: [item.senderId] })
  toast.success('已移出群聊')
  emit('reload-group-members')
}

/** 置顶群消息 */
async function pinMessage(item: Message) {
  if (!item.id || !group.value?.id || isPinnedMessage(item.id) || pinningMessageId.value != null) {
    return
  }
  try {
    await dialog.confirm({ title: '置顶消息', msg: '将在当前群成员的聊天中置顶' })
  } catch {
    return
  }
  pinningMessageId.value = item.id
  try {
    await pinGroupMessage({ id: group.value.id, messageId: item.id })
    toast.success('已置顶')
    emit('reload-group-state')
  } finally {
    pinningMessageId.value = undefined
  }
}

/** 撤回消息 */
async function recall(item: Message) {
  if (!item.id || !canRecallMessage(item, props.conversationType, userStore.userInfo.userId)) {
    return
  }
  try {
    await dialog.confirm({ title: '撤回消息', msg: '确定撤回该消息吗？' })
  } catch {
    return
  }
  if (!await props.recallMessage(item)) {
    return
  }
  emit('recalled', item.id)
  toast.success('已撤回')
}

defineExpose({ open })
</script>
