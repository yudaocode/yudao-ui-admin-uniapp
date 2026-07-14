import { http } from '@/http/http'

/** IM 好友申请 */
export interface ImFriendRequestRespVO {
  id: number
  fromUserId: number
  toUserId: number
  handleResult: number
  applyContent?: string
  handleContent?: string
  addSource?: number
  handleTime?: string
  createTime: string
  updateTime?: number
  fromNickname?: string
  fromAvatar?: string
  toNickname?: string
  toAvatar?: string
}

/** IM 好友申请发起 */
export interface ImFriendRequestApplyReq {
  toUserId: number
  applyContent?: string
  displayName?: string
  addSource?: number
}

/** 发起好友申请 */
export function applyFriendRequest(data: ImFriendRequestApplyReq) {
  return http.post<number | null>('/im/friend-request/apply', data)
}

/** 同意好友申请 */
export function agreeFriendRequest(id: number | string) {
  return http.put<boolean>('/im/friend-request/agree', undefined, { id })
}

/** 拒绝好友申请 */
export function refuseFriendRequest(id: number | string, handleContent?: string) {
  return http.put<boolean>('/im/friend-request/refuse', undefined, { id, handleContent })
}

/** 查询我相关的好友申请列表 */
export function getMyFriendRequestList(limit: number, maxId?: number) {
  const params: Record<string, number> = { limit }
  if (maxId != null) {
    params.maxId = maxId
  }
  return http.get<ImFriendRequestRespVO[]>('/im/friend-request/list', params)
}

/** 增量拉取当前用户相关的好友申请 */
export function pullMyFriendRequestList(params: { lastUpdateTime?: number, lastId?: number, limit: number }) {
  return http.get<ImFriendRequestRespVO[]>('/im/friend-request/pull', params)
}

/** 获得我相关的好友申请详情 */
export function getMyFriendRequest(id: number) {
  return http.get<ImFriendRequestRespVO | null>('/im/friend-request/get', { id })
}
