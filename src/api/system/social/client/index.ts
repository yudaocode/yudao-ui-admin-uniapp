import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 社交客户端信息 */
export interface SocialClient {
  id?: number
  name: string
  socialType: number
  userType: number
  clientId: string
  clientSecret: string
  agentId?: string
  publicKey?: string
  status: number
  createTime?: Date
}

/** 获取社交客户端分页列表 */
export function getSocialClientPage(params: PageParam) {
  return http.get<PageResult<SocialClient>>('/system/social-client/page', params)
}

/** 获取社交客户端详情 */
export function getSocialClient(id: number) {
  return http.get<SocialClient>(`/system/social-client/get?id=${id}`)
}

/** 创建社交客户端 */
export function createSocialClient(data: SocialClient) {
  return http.post<number>('/system/social-client/create', data)
}

/** 更新社交客户端 */
export function updateSocialClient(data: SocialClient) {
  return http.put<boolean>('/system/social-client/update', data)
}

/** 删除社交客户端 */
export function deleteSocialClient(id: number) {
  return http.delete<boolean>(`/system/social-client/delete?id=${id}`)
}
