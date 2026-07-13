import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import { http } from '@/http/http'

/** IM 群 */
export interface ImGroupRespVO {
  id: number
  name: string
  ownerUserId: number
  avatar?: string
  notice?: string
  banned?: boolean
  mutedAll?: boolean
  joinApproval?: boolean
  bannedTime?: string
  status: number
  dissolvedTime?: string
  createTime?: string
  pinnedMessages?: ImGroupMessageRespVO[]
  joinStatus?: number
  groupRemark?: string
  silent?: boolean
}

/** IM 群创建 */
export interface ImGroupCreateReq {
  name: string
  memberUserIds?: number[]
  joinApproval?: boolean
}

/** IM 群更新 */
export interface ImGroupUpdateReq {
  id: number
  name?: string
  avatar?: string
  notice?: string
  joinApproval?: boolean
}

/** IM 群管理员变更 */
export interface ImGroupAdminReq {
  id: number
  userIds: number[]
}

/** IM 群主转让 */
export interface ImGroupTransferOwnerReq {
  id: number
  newOwnerUserId: number
}

/** IM 全群禁言 */
export interface ImGroupMuteAllReq {
  id: number
  mutedAll: boolean
}

/** IM 群成员禁言 */
export interface ImGroupMuteMemberReq {
  id: number
  userId: number
  mutedSeconds: number
}

/** IM 取消群成员禁言 */
export interface ImGroupCancelMuteMemberReq {
  id: number
  userId: number
}

/** IM 群消息置顶 */
export interface ImGroupMessagePinReq {
  id: number
  messageId: number
}

/** 获得当前登录用户的群列表 */
export function getMyGroupList() {
  return http.get<ImGroupRespVO[]>('/im/group/list')
}

/** 获得群详情 */
export function getGroup(id: number | string) {
  return http.get<ImGroupRespVO>('/im/group/get', { id })
}

/** 创建群 */
export function createGroup(data: ImGroupCreateReq) {
  return http.post<ImGroupRespVO>('/im/group/create', data)
}

/** 更新群 */
export function updateGroup(data: ImGroupUpdateReq) {
  return http.put<ImGroupRespVO>('/im/group/update', data)
}

/** 解散群 */
export function dissolveGroup(id: number | string) {
  return http.delete<boolean>('/im/group/dissolve', undefined, { id })
}

/** 添加群管理员 */
export function addGroupAdmin(data: ImGroupAdminReq) {
  return http.put<boolean>('/im/group/add-admin', data)
}

/** 撤销群管理员 */
export function removeGroupAdmin(data: ImGroupAdminReq) {
  return http.put<boolean>('/im/group/remove-admin', data)
}

/** 转让群主 */
export function transferGroupOwner(data: ImGroupTransferOwnerReq) {
  return http.put<boolean>('/im/group/transfer-owner', data)
}

/** 置顶群消息 */
export function pinGroupMessage(data: ImGroupMessagePinReq) {
  return http.put<boolean>('/im/group/pin-message', data)
}

/** 取消置顶群消息 */
export function unpinGroupMessage(data: ImGroupMessagePinReq) {
  return http.put<boolean>('/im/group/unpin-message', data)
}

/** 全群禁言 */
export function muteAll(data: ImGroupMuteAllReq) {
  return http.put<boolean>('/im/group/mute-all', data)
}

/** 禁言成员 */
export function muteMember(data: ImGroupMuteMemberReq) {
  return http.put<boolean>('/im/group/mute-member', data)
}

/** 取消成员禁言 */
export function cancelMuteMember(data: ImGroupCancelMuteMemberReq) {
  return http.put<boolean>('/im/group/cancel-mute-member', data)
}
