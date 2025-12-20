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

/** 获取社交用户分页列表 */
export function getSocialUserPage(params: PageParam) {
  return http.get<PageResult<SocialUser>>('/system/social-user/page', params)
}

/** 获取社交用户详情 */
export function getSocialUser(id: number) {
  return http.get<SocialUser>(`/system/social-user/get?id=${id}`)
}
