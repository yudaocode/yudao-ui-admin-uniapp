import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OAuth2.0 客户端信息 */
export interface OAuth2Client {
  id?: number
  clientId: string
  secret: string
  name: string
  logo: string
  description: string
  status: number
  accessTokenValiditySeconds: number
  refreshTokenValiditySeconds: number
  redirectUris: string[]
  autoApprove: boolean
  authorizedGrantTypes: string[]
  scopes: string[]
  authorities: string[]
  resourceIds: string[]
  additionalInformation: string
  createTime?: Date
}

/** 获取 OAuth2.0 客户端分页列表 */
export function getOAuth2ClientPage(params: PageParam) {
  return http.get<PageResult<OAuth2Client>>('/system/oauth2-client/page', params)
}

/** 获取 OAuth2.0 客户端详情 */
export function getOAuth2Client(id: number) {
  return http.get<OAuth2Client>(`/system/oauth2-client/get?id=${id}`)
}

/** 创建 OAuth2.0 客户端 */
export function createOAuth2Client(data: OAuth2Client) {
  return http.post<number>('/system/oauth2-client/create', data)
}

/** 更新 OAuth2.0 客户端 */
export function updateOAuth2Client(data: OAuth2Client) {
  return http.put<boolean>('/system/oauth2-client/update', data)
}

/** 删除 OAuth2.0 客户端 */
export function deleteOAuth2Client(id: number) {
  return http.delete<boolean>(`/system/oauth2-client/delete?id=${id}`)
}
