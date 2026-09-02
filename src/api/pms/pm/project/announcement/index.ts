import { http } from '@/http/http'

/** PMS 项目公告 */
export interface ProjectAnnouncement {
  id: number // 公告编号
  projectId: number // 项目编号
  content: string // 公告内容
  fileUrls: string[] // 附件地址列表
  creatorUserId: number // 创建者用户编号
  creatorUserName?: string // 创建者用户昵称
  createTime: number // 创建时间
  updateTime: number // 更新时间
}

/** 查询项目公告列表 */
export function getProjectAnnouncementList(projectId: number) {
  return http.get<ProjectAnnouncement[]>('/pms/pm/project-announcement/list', { projectId })
}

/** 查询项目公告详情 */
export function getProjectAnnouncement(id: number) {
  return http.get<ProjectAnnouncement>('/pms/pm/project-announcement/get', { id })
}

/** 新增项目公告 */
export function createProjectAnnouncement(data: Partial<ProjectAnnouncement>) {
  return http.post<number>('/pms/pm/project-announcement/create', data)
}

/** 修改项目公告 */
export function updateProjectAnnouncement(data: Partial<ProjectAnnouncement>) {
  return http.put<boolean>('/pms/pm/project-announcement/update', data)
}

/** 删除项目公告 */
export function deleteProjectAnnouncement(id: number) {
  return http.delete<boolean>('/pms/pm/project-announcement/delete', undefined, { id })
}
