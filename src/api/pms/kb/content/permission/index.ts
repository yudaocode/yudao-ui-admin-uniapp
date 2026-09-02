import { http } from '@/http/http'

/** PMS 知识内容协作者 */
export interface KnowledgeContentPermissionMember {
  id?: number // 协作者编号
  userId?: number // 用户编号
  userName?: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  level: number // 协作等级
}

/** PMS 知识内容协作权限 */
export interface KnowledgeContentPermission {
  id: number // 协作权限编号
  libraryId: number // 知识库编号
  openStatus: boolean // 是否公开
  openLevel: number // 公开协作等级
  creatorUserId: number // 创建人用户编号
  currentUserLevel: number // 当前用户协作等级
  members: KnowledgeContentPermissionMember[] // 协作者列表
}

/** 查询知识内容协作权限 */
export function getKnowledgeContentPermission(id: number) {
  return http.get<KnowledgeContentPermission>('/pms/kb/content-permission/get', { id })
}

/** 修改知识内容协作权限 */
export function updateKnowledgeContentPermission(data: Partial<KnowledgeContentPermission>) {
  return http.put<boolean>('/pms/kb/content-permission/update', data)
}
