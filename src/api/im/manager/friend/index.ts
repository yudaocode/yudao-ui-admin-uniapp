import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端好友关系 */
export interface ImManagerFriendVO {
  id: number
  userId: number
  userNickname?: string
  friendUserId: number
  friendNickname?: string
  displayName?: string
  addSource?: number
  silent: boolean
  pinned: boolean
  blocked: boolean
  status: number
  addTime?: string
  deleteTime?: string
  createTime: string
}

/** 获取好友关系分页 */
export function getManagerFriendPage(params: PageParam) {
  return http.get<PageResult<ImManagerFriendVO>>('/im/manager/friend/page', params)
}
