import { http } from '@/http/http'

/** PMS 项目成员 */
export interface ProjectMember {
  userId: number // 后台用户编号
  nickname: string // 用户昵称
  avatar?: string // 用户头像
  level: number // 成员权限级别
  creatorStatus: boolean // 是否项目创建人
}

/** PMS 项目成员项 */
export interface ProjectMemberItem {
  userId: number // 后台用户编号
  level: number // 成员权限级别
}

/** 查询项目成员列表 */
export function getProjectMemberList(projectId: number) {
  return http.get<ProjectMember[]>('/pms/pm/project-member/list', { projectId })
}

/** 修改项目成员列表 */
export function updateProjectMemberList(projectId: number, members: ProjectMemberItem[]) {
  return http.put<boolean>('/pms/pm/project-member/update-list', { projectId, members })
}

/** 删除项目成员 */
export function deleteProjectMember(projectId: number, userId: number) {
  return http.delete<boolean>('/pms/pm/project-member/delete', undefined, { projectId, userId })
}

/** 退出项目 */
export function exitProject(projectId: number) {
  return http.delete<boolean>('/pms/pm/project-member/exit', undefined, { projectId })
}
