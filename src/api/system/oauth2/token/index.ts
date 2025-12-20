import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OAuth2.0 令牌信息 */
export interface OAuth2Token {
  id?: number
  accessToken: string
  refreshToken: string
  userId: number
  userType: number
  clientId: string
  createTime?: Date
  expiresTime?: Date
}

/** 获取 OAuth2.0 令牌分页列表 */
export function getOAuth2TokenPage(params: PageParam) {
  return http.get<PageResult<OAuth2Token>>('/system/oauth2-token/page', params)
}

/** 删除 OAuth2.0 令牌 */
export function deleteOAuth2Token(accessToken: string) {
  return http.delete<boolean>(`/system/oauth2-token/delete?accessToken=${accessToken}`)
}
