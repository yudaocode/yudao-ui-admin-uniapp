import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @AI：不用 baseUrl 方式
const baseUrl = '/infra/job'

/** 定时任务信息 */
export interface Job {
  id?: number
  name: string
  status: number
  handlerName: string
  handlerParam: string
  cronExpression: string
  retryCount: number
  retryInterval: number
  monitorTimeout: number
  createTime?: Date
  nextTimes?: Date[]
}

/** 获取定时任务分页列表 */
export function getJobPage(params: PageParam) {
  return http.get<PageResult<Job>>(`${baseUrl}/page`, params)
}

/** 获取定时任务详情 */
export function getJob(id: number) {
  return http.get<Job>(`${baseUrl}/get?id=${id}`)
}

/** 创建定时任务 */
export function createJob(data: Job) {
  return http.post<number>(`${baseUrl}/create`, data)
}

/** 更新定时任务 */
export function updateJob(data: Job) {
  return http.put<boolean>(`${baseUrl}/update`, data)
}

/** 删除定时任务 */
export function deleteJob(id: number) {
  return http.delete<boolean>(`${baseUrl}/delete?id=${id}`)
}

/** 更新定时任务状态 */
export function updateJobStatus(id: number, status: number) {
  return http.put<boolean>(`${baseUrl}/update-status`, { id, status })
}

/** 立即执行一次定时任务 */
export function runJob(id: number) {
  return http.put<boolean>(`${baseUrl}/trigger?id=${id}`)
}

/** 获取定时任务的下 n 次执行时间 */
export function getJobNextTimes(id: number) {
  return http.get<Date[]>(`${baseUrl}/get_next_times?id=${id}`)
}
