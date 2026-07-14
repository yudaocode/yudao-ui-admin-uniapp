import { http } from '@/http/http'

/** IM 加群申请 */
export interface ImGroupRequestRespVO {
  id: number
  groupId: number
  userId: number
  inviterUserId?: number
  handleResult: number
  applyContent?: string
  handleContent?: string
  handleUserId?: number
  addSource?: number
  handleTime?: string
  createTime: string
  updateTime?: number
  userNickname?: string
  userAvatar?: string
  inviterNickname?: string
  inviterAvatar?: string
  groupName?: string
  groupAvatar?: string
}

/** IM 加群申请发起 */
export interface ImGroupRequestApplyReq {
  groupId: number
  applyContent?: string
  addSource?: number
}

/** 申请加群 */
export function applyJoinGroup(data: ImGroupRequestApplyReq) {
  return http.post<number | null>('/im/group-request/apply', data)
}

/** 同意加群申请 */
export function agreeGroupRequest(id: number | string) {
  return http.put<boolean>('/im/group-request/agree', undefined, { id })
}

/** 拒绝加群申请 */
export function refuseGroupRequest(id: number | string, handleContent?: string) {
  return http.put<boolean>('/im/group-request/refuse', undefined, { id, handleContent })
}

/** 查询我管理群的未处理加群申请 */
export function getUnhandledRequestList() {
  return http.get<ImGroupRequestRespVO[]>('/im/group-request/unhandled-list')
}

/** 查询指定群下的全部加群申请 */
export function getGroupRequestListByGroupId(groupId: number) {
  return http.get<ImGroupRequestRespVO[]>('/im/group-request/list-by-group', { groupId })
}

/** 获得我相关的加群申请详情 */
export function getMyGroupRequest(id: number) {
  return http.get<ImGroupRequestRespVO | null>('/im/group-request/get', { id })
}

/** 增量拉取当前用户管理群的加群申请 */
export function pullMyGroupRequestList(params: { lastUpdateTime?: number, lastId?: number, limit: number }) {
  return http.get<ImGroupRequestRespVO[]>('/im/group-request/pull', params)
}
