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
