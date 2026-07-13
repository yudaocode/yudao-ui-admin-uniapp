import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端用户表情 */
export interface ImManagerFaceUserItemVO {
  id: number
  userId: number
  userNickname?: string
  url: string
  name?: string
  width?: number
  height?: number
  createTime?: string
}

/** 获取用户表情分页 */
export function getManagerFaceUserItemPage(params: PageParam) {
  return http.get<PageResult<ImManagerFaceUserItemVO>>('/im/manager/face-user-item/page', params)
}

/** 删除用户表情 */
export function deleteManagerFaceUserItem(id: number) {
  return http.delete<boolean>('/im/manager/face-user-item/delete', undefined, { id })
}
