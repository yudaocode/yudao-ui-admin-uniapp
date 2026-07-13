import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端好友申请 */
export interface ImManagerFriendRequestVO {
  id: number
  fromUserId: number
  fromNickname?: string
  toUserId: number
  toNickname?: string
  applyContent?: string
  displayName?: string
  addSource?: number
  handleResult: number
  handleContent?: string
  handleTime?: string
  createTime: string
}

/** 获取好友申请分页 */
export function getManagerFriendRequestPage(params: PageParam) {
  return http.get<PageResult<ImManagerFriendRequestVO>>('/im/manager/friend-request/page', params)
}
