import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端群 */
export interface ImManagerGroupVO {
  id: number
  name: string
  avatar?: string
  notice?: string
  ownerUserId: number
  ownerNickname?: string
  memberCount?: number
  status: number
  banned: boolean
  mutedAll?: boolean
  bannedReason?: string
  bannedTime?: string
  dissolvedTime?: string
  createTime: string
}

/** IM 管理端群成员 */
export interface ImManagerGroupMemberVO {
  userId: number
  nickname?: string
  avatar?: string
  displayUserName?: string
  groupRemark?: string
  silent?: boolean
  status: number
  role?: number
  joinTime?: string
  quitTime?: string
  muteEndTime?: string
}

/** 获取群分页 */
export function getManagerGroupPage(params: PageParam) {
  return http.get<PageResult<ImManagerGroupVO>>('/im/manager/group/page', params)
}

/** 获取群详情 */
export function getManagerGroup(id: number) {
  return http.get<ImManagerGroupVO>('/im/manager/group/get', { id })
}

/** 封禁群 */
export function banManagerGroup(data: { id: number, reason: string }) {
  return http.put<boolean>('/im/manager/group/ban', data)
}

/** 解封群 */
export function unbanManagerGroup(id: number) {
  return http.put<boolean>('/im/manager/group/unban', undefined, { id })
}

/** 解散群 */
export function dissolveManagerGroup(id: number) {
  return http.delete<boolean>('/im/manager/group/dissolve', undefined, { id })
}

/** 获取群成员列表 */
export function getManagerGroupMemberList(groupId: number) {
  return http.get<ImManagerGroupMemberVO[]>('/im/manager/group/member/list', { groupId })
}
