import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OA 公告信息 */
export interface Announcement {
  id?: number // 公告编号
  publisherUserId?: number // 发布人用户编号
  publisherUserName?: string // 发布人用户昵称
  publisherDeptId?: number // 发布人部门编号
  publisherDeptName?: string // 发布人部门名称
  type: number // 公告类型
  priority: number // 优先级
  title: string // 公告标题
  content?: string // 公告内容
  url?: string // 相关链接
  top: boolean // 是否置顶
  receiverUserIds?: number[] // 接收人用户编号列表
  receiverUserNames?: string[] // 接收人用户昵称列表
  readStatus?: boolean // 当前接收人是否已读
  forwarded?: boolean // 当前接收人是否已转发给下属
  createTime?: string // 创建时间
}

/** 查询我发布的公告分页 */
export function getPublishedAnnouncementPage(params: PageParam) {
  return http.get<PageResult<Announcement>>('/oa/announcement/published-page', params)
}

/** 查询我收到的公告分页 */
export function getReceivedAnnouncementPage(params: PageParam) {
  return http.get<PageResult<Announcement>>('/oa/announcement/received-page', params)
}

/** 查询公告详情 */
export function getAnnouncement(id: number) {
  return http.get<Announcement>(`/oa/announcement/get?id=${id}`)
}

/** 创建公告 */
export function createAnnouncement(data: Announcement) {
  return http.post<number>('/oa/announcement/create', data)
}

/** 更新公告 */
export function updateAnnouncement(data: Announcement) {
  return http.put<boolean>('/oa/announcement/update', data)
}

/** 删除发布的公告 */
export function deleteAnnouncement(id: number) {
  return http.delete<boolean>(`/oa/announcement/delete?id=${id}`)
}

/** 删除接收的公告 */
export function deleteReceivedAnnouncement(id: number) {
  return http.delete<boolean>(`/oa/announcement/delete-received?id=${id}`)
}

/** 标记公告为已读 */
export function updateAnnouncementReadStatus(id: number) {
  return http.put<boolean>(`/oa/announcement/update-read-status?id=${id}`)
}

/** 转发公告给直属下属 */
export function forwardAnnouncement(id: number) {
  return http.post<number>(`/oa/announcement/forward?id=${id}`)
}
