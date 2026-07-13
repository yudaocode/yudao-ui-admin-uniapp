import { http } from '@/http/http'

/** IM 群成员 */
export interface ImGroupMemberRespVO {
  id: number
  groupId: number
  userId: number
  displayUserName?: string
  groupRemark?: string
  silent?: boolean
  status?: number
  role?: number
  joinTime?: string
  quitTime?: string
  muteEndTime?: string
  createTime?: string
  nickname?: string
  avatar?: string
}

/** IM 群成员邀请 */
export interface ImGroupMemberInviteReq {
  groupId: number
  memberUserIds: number[]
}

/** IM 群成员移除 */
export interface ImGroupMemberRemoveReq {
  groupId: number
  memberUserIds: number[]
}

/** IM 群成员更新 */
export interface ImGroupMemberUpdateReq {
  groupId: number
  displayUserName?: string
  groupRemark?: string
  silent?: boolean
}

/** 邀请用户加入群 */
export function inviteGroupMember(data: ImGroupMemberInviteReq) {
  return http.post<boolean>('/im/group/invite', data)
}

/** 退出群 */
export function quitGroup(groupId: number | string) {
  return http.delete<boolean>('/im/group/quit', undefined, { groupId })
}

/** 移除群成员 */
export function removeGroupMember(data: ImGroupMemberRemoveReq) {
  return http.delete<boolean>('/im/group/kicking', data)
}

/** 获得群成员详情 */
export function getGroupMember(groupId: number, userId: number) {
  return http.get<ImGroupMemberRespVO>('/im/group-member/get', { groupId, userId })
}

/** 获得指定群的成员列表 */
export function getGroupMemberList(groupId: number | string) {
  return http.get<ImGroupMemberRespVO[]>('/im/group-member/list', { groupId })
}

/** 更新群成员 */
export function updateGroupMember(data: ImGroupMemberUpdateReq) {
  return http.put<boolean>('/im/group-member/update', data)
}
