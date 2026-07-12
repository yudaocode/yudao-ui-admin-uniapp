import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 社交用户信息 */
export interface SocialUser {
  id?: number
  type: number
  openid: string
  token: string
  rawTokenInfo: string
  nickname: string
  avatar: string
  rawUserInfo: string
  code: string
  state: string
  createTime?: Date
  updateTime?: Date
}

/** 当前用户的社交绑定信息 */
export interface SocialUserBind {
  id: number
  type: number
  openid: string
  nickname?: string
  avatar?: string
}

/** 社交绑定请求 */
export interface SocialUserBindReq {
  type: number
  code: string
  state: string
}

/** 取消社交绑定请求 */
export interface SocialUserUnbindReq {
  type: number
  openid: string
}

/** 获取社交用户分页列表 */
export function getSocialUserPage(params: PageParam) {
  return http.get<PageResult<SocialUser>>('/system/social-user/page', params)
}

/** 获取社交用户详情 */
export function getSocialUser(id: number) {
  return http.get<SocialUser>(`/system/social-user/get?id=${id}`)
}

/** 获取当前用户绑定的社交用户列表 */
export function getBindSocialUserList() {
  return http.get<SocialUserBind[]>('/system/social-user/get-bind-list')
}

/** 绑定当前用户的社交账号 */
export function bindSocialUser(data: SocialUserBindReq) {
  return http.post<boolean>('/system/social-user/bind', data)
}

/** 取消当前用户的社交绑定 */
export function unbindSocialUser(data: SocialUserUnbindReq) {
  return http.delete<boolean>('/system/social-user/unbind', data)
}
