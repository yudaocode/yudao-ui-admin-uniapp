import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

const baseUrl = '/system/notice'

/** 通知公告信息 */
export interface Notice {
  id?: number
  title: string
  content: string
  type: number
  status: number
  createTime?: Date
}

/** 获取通知公告分页列表 */
export function getNoticePage(params: PageParam) {
  return http.get<PageResult<Notice>>(`${baseUrl}/page`, params)
}

/** 获取通知公告详情 */
export function getNotice(id: number) {
  return http.get<Notice>(`${baseUrl}/get?id=${id}`)
}

/** 创建通知公告 */
export function createNotice(data: Notice) {
  return http.post<number>(`${baseUrl}/create`, data)
}

/** 更新通知公告 */
export function updateNotice(data: Notice) {
  return http.put<boolean>(`${baseUrl}/update`, data)
}

/** 删除通知公告 */
export function deleteNotice(id: number) {
  return http.delete<boolean>(`${baseUrl}/delete?id=${id}`)
}
