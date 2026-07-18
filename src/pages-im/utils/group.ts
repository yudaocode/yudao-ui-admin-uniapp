import type { FriendLite } from '../home/types'

/** 根据已选好友生成默认群名 */
export function buildDefaultGroupName(members: FriendLite[]) {
  if (members.length === 0) {
    return '群聊'
  }
  const names = members.slice(0, 4).map(member => member.displayName || member.nickname || '').filter(Boolean)
  const head = names.join('、')
  return members.length > 4 ? `${head}等${members.length + 1}人` : head || '群聊'
}

/** 获取群头像网格列数 */
export function getGroupAvatarGridColumns(memberCount: number) {
  if (memberCount <= 1) {
    return 1
  }
  return memberCount <= 4 ? 2 : 3
}
