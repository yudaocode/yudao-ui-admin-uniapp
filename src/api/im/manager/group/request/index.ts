import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端加群申请 */
export interface ImManagerGroupRequestVO {
  id: number
  groupId: number
  groupName?: string
  userId: number
  userNickname?: string
  inviterUserId?: number
  inviterNickname?: string
  applyContent?: string
  addSource?: number
  handleResult: number
  handleUserId?: number
  handleNickname?: string
  handleContent?: string
  handleTime?: string
  createTime: string
}

/** 获取加群申请分页 */
export function getManagerGroupRequestPage(params: PageParam) {
  return http.get<PageResult<ImManagerGroupRequestVO>>('/im/manager/group-request/page', params)
}
