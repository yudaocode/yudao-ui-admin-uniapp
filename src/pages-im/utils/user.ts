import type { MentionCandidate } from './message'
import type { Conversation, Friend, Group } from '@/pages-im/home/types'
import { useFriendStore } from '@/pages-im/home/store/friendStore'
import { useGroupStore } from '@/pages-im/home/store/groupStore'
import { useUserStore } from '@/store/user'
import {
  CommonStatusEnum,
  IM_AT_ALL_NICKNAME,
  IM_AT_ALL_USER_ID,
  ImConversationType,
  ImGroupMemberRole,
} from './constants'

const EMPTY_MENTIONS: MentionCandidate[] = [] // 无 @ 场景复用稳定空数组
const AVATAR_BG_COLORS = ['#07C160', '#1A95FF', '#FA9D3B', '#9163E0', '#F76760', '#1ABC9C'] // 头像色卡底色调色板（参考微信）

/** 判断当前用户是否已退出群聊 */
export function isGroupQuit(group?: Group | null): boolean {
  return group?.joinStatus === CommonStatusEnum.DISABLE
}

/** 获取好友显示名：好友备注优先于真实昵称 */
export function getFriendDisplayName(friend: Pick<Friend, 'nickname' | 'displayName'>): string {
  return friend.displayName || friend.nickname
}

/** 获取群成员显示名：好友备注、群昵称、真实昵称依次兜底 */
export function getMemberDisplayName(
  member: { displayUserName?: string, nickname: string },
  friend?: Pick<Friend, 'displayName'> | null,
): string {
  return friend?.displayName || member.displayUserName || member.nickname
}

/** 获取群成员角色标签；普通成员不展示 */
export function getGroupMemberRoleLabel(role?: number): string {
  if (role === ImGroupMemberRole.OWNER) {
    return '群主'
  }
  if (role === ImGroupMemberRole.ADMIN) {
    return '管理员'
  }
  return ''
}

/** 获取群聊显示名：当前用户设置的群备注优先于群名称 */
export function getGroupDisplayName(group: Pick<Group, 'name' | 'groupRemark'>): string {
  return group.groupRemark || group.name
}

/** 尝试获取消息发送人的上下文显示名 */
export function tryGetSenderDisplayName(
  senderId: number,
  conversationType: number,
  conversationTargetId: number,
): string | undefined {
  const userStore = useUserStore()
  if (conversationType === ImConversationType.GROUP) {
    const friend = useFriendStore().getFriend(senderId)
    const member = useGroupStore().getGroup(conversationTargetId)?.members?.find(item => item.userId === senderId)
    if (member) {
      return getMemberDisplayName(member, friend)
    }
    if (senderId === userStore.userInfo.userId) {
      return userStore.userInfo.nickname || undefined
    }
    return undefined
  }
  if (senderId === userStore.userInfo.userId) {
    return userStore.userInfo.nickname || undefined
  }
  if (conversationType === ImConversationType.PRIVATE) {
    const friend = useFriendStore().getFriend(senderId)
    return friend ? getFriendDisplayName(friend) : undefined
  }
  return undefined
}

/** 获取消息发送人的上下文显示名 */
export function getSenderDisplayName(
  senderId: number,
  conversationType: number,
  conversationTargetId: number,
  fallbackName?: string,
): string {
  const real = tryGetSenderDisplayName(senderId, conversationType, conversationTargetId)
  if (real) {
    return real
  }
  if (fallbackName) {
    return fallbackName
  }
  if (senderId === useUserStore().userInfo.userId) {
    return useUserStore().userInfo.nickname || String(senderId)
  }
  return String(senderId)
}

/** 获取消息发送人的真实昵称 */
export function getSenderRealNickname(
  senderId: number,
  conversationType: number,
  conversationTargetId: number,
): string {
  const userStore = useUserStore()
  if (conversationType === ImConversationType.GROUP) {
    const member = useGroupStore().getGroup(conversationTargetId)?.members?.find(item => item.userId === senderId)
    if (member?.nickname) {
      return member.nickname
    }
    if (senderId === userStore.userInfo.userId) {
      return userStore.userInfo.nickname || String(senderId)
    }
    return String(senderId)
  }
  if (senderId === userStore.userInfo.userId) {
    return userStore.userInfo.nickname || String(senderId)
  }
  if (conversationType === ImConversationType.PRIVATE) {
    return useFriendStore().getFriend(senderId)?.nickname || String(senderId)
  }
  return String(senderId)
}

/** 获取消息发送人的头像 */
export function getSenderAvatar(
  senderId: number,
  conversationType: number,
  conversationTargetId: number,
): string {
  const userStore = useUserStore()
  if (senderId === userStore.userInfo.userId) {
    return userStore.userInfo.avatar || ''
  }
  if (conversationType === ImConversationType.GROUP) {
    const member = useGroupStore().getGroup(conversationTargetId)?.members?.find(item => item.userId === senderId)
    if (member?.avatar) {
      return member.avatar
    }
  }
  return useFriendStore().getFriend(senderId)?.avatar || ''
}

/** 获取群消息 @ 提及候选 */
export function getMentionCandidates(
  atUserIds: number[] | undefined,
  conversation: Pick<Conversation, 'type' | 'targetId'> | null | undefined,
): MentionCandidate[] {
  if (!atUserIds || atUserIds.length === 0) {
    return EMPTY_MENTIONS
  }
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return EMPTY_MENTIONS
  }
  const members = useGroupStore().getGroup(conversation.targetId)?.members || []
  const memberById = new Map(members.map(member => [member.userId, member]))
  const friendStore = useFriendStore()
  const candidates: MentionCandidate[] = []
  const seen = new Set<string>()
  for (const userId of atUserIds) {
    if (userId === IM_AT_ALL_USER_ID) {
      const key = `${IM_AT_ALL_USER_ID}#${IM_AT_ALL_NICKNAME}`
      if (!seen.has(key)) {
        seen.add(key)
        candidates.push({
          userId,
          name: IM_AT_ALL_NICKNAME,
          displayName: IM_AT_ALL_NICKNAME,
        })
      }
      continue
    }
    const member = memberById.get(userId)
    const friend = friendStore.getFriend(userId)
    const nickname = (member?.nickname || friend?.nickname || '').trim()
    if (!nickname) {
      continue
    }
    for (const literal of [nickname, friend?.displayName, member?.displayUserName]) {
      const trimmed = (literal || '').trim()
      if (!trimmed) {
        continue
      }
      const key = `${userId}#${trimmed}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      candidates.push({ userId, name: trimmed, displayName: nickname })
    }
  }
  const nameCount = new Map<string, number>()
  candidates.forEach(candidate => nameCount.set(candidate.name, (nameCount.get(candidate.name) || 0) + 1))
  for (const candidate of candidates) {
    if ((nameCount.get(candidate.name) || 0) > 1) {
      candidate.ambiguous = true
    }
  }
  return candidates
}

/** 获取头像色卡文字：中文取首字、英文取前 2 字母大写、其他取首字大写 */
export function getAvatarText(name?: string): string {
  const trimmed = name?.trim()
  if (!trimmed) {
    return ''
  }
  const first = trimmed.charAt(0)
  const code = first.charCodeAt(0)
  if (code >= 0x4E00 && code <= 0x9FA5) {
    return first
  }
  const letters = trimmed.match(/[a-z]/gi)
  if (!letters || letters.length === 0) {
    return first.toUpperCase()
  }
  return letters.slice(0, 2).join('').toUpperCase()
}

/** 获取头像色卡底色 */
export function getAvatarBgColor(name?: string): string {
  if (!name) {
    return '#909399'
  }
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i)
  }
  return AVATAR_BG_COLORS[hash % AVATAR_BG_COLORS.length]
}
