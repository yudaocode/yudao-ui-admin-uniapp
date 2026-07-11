import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 班组 */
export interface CalTeam {
  id?: number
  code: string // 班组编码
  name: string // 班组名称
  calendarType?: number // 班组类型
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询班组分页 */
export function getTeamPage(params: PageParam) {
  return http.get<PageResult<CalTeam>>(`/mes/cal/team/page`, params)
}

/** 查询班组详情 */
export function getTeam(id: number) {
  return http.get<CalTeam>(`/mes/cal/team/get?id=${id}`)
}

/** 新增班组 */
export function createTeam(data: CalTeam) {
  return http.post<number>(`/mes/cal/team/create`, data)
}

/** 修改班组 */
export function updateTeam(data: CalTeam) {
  return http.put<boolean>(`/mes/cal/team/update`, data)
}

/** 删除班组 */
export function deleteTeam(id: number) {
  return http.delete<boolean>(`/mes/cal/team/delete?id=${id}`)
}

/** 获得班组列表（全量，用于下拉选择） */
export function getTeamList() {
  return http.get<CalTeam[]>(`/mes/cal/team/list`)
}
