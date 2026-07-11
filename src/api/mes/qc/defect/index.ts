import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 缺陷类型 */
export interface QcDefect {
  id?: number // 编号
  code: string // 缺陷编码
  name: string // 缺陷描述
  type?: number // 检测项类型
  level?: number // 缺陷等级
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询缺陷类型分页 */
export function getDefectPage(params: PageParam) {
  return http.get<PageResult<QcDefect>>(`/mes/qc/defect/page`, params)
}

/** 查询缺陷类型精简列表 */
export function getDefectSimpleList() {
  return http.get<QcDefect[]>(`/mes/qc/defect/simple-list`)
}

/** 查询缺陷类型详情 */
export function getDefect(id: number) {
  return http.get<QcDefect>(`/mes/qc/defect/get?id=${id}`)
}

/** 新增缺陷类型 */
export function createDefect(data: QcDefect) {
  return http.post<number>(`/mes/qc/defect/create`, data)
}

/** 修改缺陷类型 */
export function updateDefect(data: QcDefect) {
  return http.put<boolean>(`/mes/qc/defect/update`, data)
}

/** 删除缺陷类型 */
export function deleteDefect(id: number) {
  return http.delete<boolean>(`/mes/qc/defect/delete?id=${id}`)
}
