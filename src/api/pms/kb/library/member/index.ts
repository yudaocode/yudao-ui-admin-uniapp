import { http } from '@/http/http'

/** PMS 知识库成员 */
export interface KnowledgeLibraryMember {
  id: number // 成员编号
  userId?: number // 用户编号
  nickname?: string // 用户姓名
  avatar?: string // 用户头像
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  parentDeptId?: number // 父部门编号
  parentDeptName?: string // 父部门名称
  level: number // 成员等级
}

/** PMS 知识库成员列表修改请求 */
export interface KnowledgeLibraryMemberUpdateReq {
  libraryId: number // 知识库编号
  members: Array<{ userId?: number, deptId?: number, level: number }> // 成员列表
}

/** 查询知识库成员列表 */
export function getKnowledgeLibraryMemberList(libraryId: number) {
  return http.get<KnowledgeLibraryMember[]>('/pms/kb/library-member/list', { libraryId })
}

/** 修改知识库成员列表 */
export function updateKnowledgeLibraryMemberList(data: KnowledgeLibraryMemberUpdateReq) {
  return http.put<boolean>('/pms/kb/library-member/update-list', data)
}

/** 退出知识库 */
export function exitKnowledgeLibrary(libraryId: number) {
  return http.delete<boolean>('/pms/kb/library-member/exit', undefined, { libraryId })
}
