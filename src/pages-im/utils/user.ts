/** 获取好友显示名：好友备注优先于真实昵称 */
export function getFriendDisplayName(friend: {
  friendUserId: number
  displayName?: string
  nickname?: string
}) {
  return friend.displayName || friend.nickname || `用户 ${friend.friendUserId}`
}

/** 获取群成员显示名：群昵称优先于真实昵称 */
export function getMemberDisplayName(member?: {
  userId: number
  displayUserName?: string
  nickname?: string
}) {
  return member?.displayUserName || member?.nickname || `用户 ${member?.userId}`
}

/** 获取群聊显示名：当前用户设置的群备注优先于群名称 */
export function getGroupDisplayName(group: {
  name?: string
  groupRemark?: string
}) {
  return group.groupRemark || group.name || ''
}
