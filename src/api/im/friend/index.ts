import { http } from '@/http/http'

/** IM 好友 */
export interface ImFriendRespVO {
  id: number
  friendUserId: number
  silent?: boolean
  displayName?: string
  displayNamePinyin?: string
  addSource?: number
  pinned?: boolean
  blocked?: boolean
  status?: number
  addTime?: string
  deleteTime?: string
  nickname?: string
  nicknamePinyin?: string
  avatar?: string
}

/** IM 好友更新 */
export interface ImFriendUpdateReq {
  friendUserId: number
  silent?: boolean
  displayName?: string
  pinned?: boolean
}

/** 获得当前登录用户的好友列表 */
export function getMyFriendList() {
  return http.get<ImFriendRespVO[]>('/im/friend/list')
}

/** 获得好友详情 */
export function getFriend(friendUserId: number | string) {
  return http.get<ImFriendRespVO>('/im/friend/get', { friendUserId })
}

/** 删除好友 */
export function deleteFriend(friendUserId: number | string, clear: boolean) {
  return http.delete<boolean>('/im/friend/delete', undefined, { friendUserId, clear })
}

/** 更新好友信息 */
export function updateFriend(data: ImFriendUpdateReq) {
  return http.put<boolean>('/im/friend/update', data)
}

/** 拉黑好友 */
export function blockFriend(friendUserId: number | string) {
  return http.put<boolean>('/im/friend/block', undefined, { friendUserId })
}

/** 移出黑名单 */
export function unblockFriend(friendUserId: number | string) {
  return http.put<boolean>('/im/friend/unblock', undefined, { friendUserId })
}
