import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OA 日程参与人阅读信息 */
export interface ScheduleParticipant {
  userId: number // 参与人用户编号
  userName: string // 参与人用户昵称
  readStatus: boolean // 是否已读
  readTime?: string // 首次阅读时间
}

/** OA 日程信息 */
export interface Schedule {
  id?: number // 日程编号
  creator?: string // 创建人用户编号
  creatorName?: string // 创建人用户昵称
  creatorDeptName?: string // 创建人部门名称
  type: number // 日程类型
  priority: number // 优先级
  title: string // 标题
  description?: string // 描述
  startTime: string // 开始时间
  endTime: string // 结束时间
  remind: boolean // 是否提醒
  participantUserIds?: number[] // 参与人用户编号列表
  participantUserNames?: string[] // 参与人用户昵称列表
  createTime?: string // 创建时间
  participants?: ScheduleParticipant[] // 参与人阅读信息，仅详情返回
}

/** 查询所选范围内的日程分页 */
export function getSchedulePage(params: PageParam) {
  return http.get<PageResult<Schedule>>('/oa/schedule/page', params)
}

/** 查询日程详情 */
export function getSchedule(id: number) {
  return http.get<Schedule>(`/oa/schedule/get?id=${id}`)
}

/** 标记本人已阅读日程 */
export function updateScheduleReadStatus(id: number) {
  return http.put<boolean>(`/oa/schedule/update-read-status?id=${id}`)
}

/** 创建日程 */
export function createSchedule(data: Schedule) {
  return http.post<number>('/oa/schedule/create', data)
}

/** 更新日程 */
export function updateSchedule(data: Schedule) {
  return http.put<boolean>('/oa/schedule/update', data)
}

/** 删除日程 */
export function deleteSchedule(id: number) {
  return http.delete<boolean>(`/oa/schedule/delete?id=${id}`)
}

/** 查询本人参与的日程分页，startTime 为起止区间 */
export function getMySchedulePage(params: PageParam) {
  return http.get<PageResult<Schedule>>('/oa/schedule/my-page', params)
}
