import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 请假申请 */
export interface Leave {
  id: number
  status: number
  type: number
  reason: string
  processInstanceId: string
  startTime: number
  endTime: number
  createTime: Date
  startUserSelectAssignees?: Record<string, number[]>
}

/** 创建请假申请 */
export function createLeave(data: Partial<Leave>) {
  return http.post<number>('/bpm/oa/leave/create', data)
}

/** 更新请假申请，只提交业务编号和修改后的业务字段 */
export interface LeaveUpdate {
  id: number
  type?: number
  startTime?: number
  endTime?: number
  reason?: string
}

export function updateLeave(data: LeaveUpdate) {
  return http.put('/bpm/oa/leave/update', data)
}

/** 获得请假申请 */
export function getLeave(id: number) {
  return http.get<Leave>(`/bpm/oa/leave/get?id=${id}`)
}

/** 获得请假申请分页 */
export function getLeavePage(params: PageParam) {
  return http.get<PageResult<Leave>>('/bpm/oa/leave/page', params)
}
