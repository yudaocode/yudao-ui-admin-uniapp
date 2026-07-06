import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 会员用户 */
export interface MemberUser {
  id?: number
  avatar?: string
  birthday?: string | number | Date
  createTime?: string
  loginDate?: string | number | Date
  loginIp?: string
  mark?: string
  mobile?: string
  email?: string
  name?: string
  nickname?: string
  registerIp?: string
  sex?: number
  status?: number
  areaId?: number
  areaName?: string
  tagIds?: number[]
  tagNames?: string[]
  levelId?: number
  levelName?: string
  groupId?: number
  groupName?: string
  point?: number
  totalPoint?: number
  experience?: number
}

/** 会员等级修改 */
export interface MemberUserLevelUpdateReq {
  id?: number
  levelId?: number
  reason?: string
}

/** 会员积分修改 */
export interface MemberUserPointUpdateReq {
  id?: number
  point: number
}

/** 获取会员用户分页列表 */
export function getMemberUserPage(params: PageParam) {
  return http.get<PageResult<MemberUser>>('/member/user/page', params)
}

/** 获取会员用户详情 */
export function getMemberUser(id: number) {
  return http.get<MemberUser>(`/member/user/get?id=${id}`)
}

/** 更新会员用户 */
export function updateMemberUser(data: MemberUser) {
  return http.put<boolean>('/member/user/update', data)
}

/** 修改会员用户等级 */
export function updateMemberUserLevel(data: MemberUserLevelUpdateReq) {
  return http.put<boolean>('/member/user/update-level', data)
}

/** 修改会员用户积分 */
export function updateMemberUserPoint(data: MemberUserPointUpdateReq) {
  return http.put<boolean>('/member/user/update-point', data)
}
