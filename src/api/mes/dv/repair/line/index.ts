import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 维修工单行 */
export interface DvRepairLine {
  id?: number // 编号
  repairId: number // 维修工单编号
  subjectId?: number // 项目编号
  subjectName?: string // 项目名称
  subjectContent?: string // 项目内容
  subjectStandard?: string // 项目标准
  malfunction?: string // 故障描述
  malfunctionUrl?: string // 故障图片 URL
  description?: string // 维修描述
  remark?: string // 备注
}

/** 查询维修工单行分页 */
export function getRepairLinePage(params: PageParam) {
  return http.get<PageResult<DvRepairLine>>('/mes/dv/repair-line/page', params)
}

/** 查询指定维修工单的明细列表 */
export function getRepairLineListByRepairId(repairId: number) {
  return http.get<DvRepairLine[]>('/mes/dv/repair-line/list-by-repair-id', { repairId })
}

/** 查询维修工单行详情 */
export function getRepairLine(id: number) {
  return http.get<DvRepairLine>(`/mes/dv/repair-line/get?id=${id}`)
}

/** 新增维修工单行 */
export function createRepairLine(data: DvRepairLine) {
  return http.post<number>('/mes/dv/repair-line/create', data)
}

/** 修改维修工单行 */
export function updateRepairLine(data: DvRepairLine) {
  return http.put<boolean>('/mes/dv/repair-line/update', data)
}

/** 删除维修工单行 */
export function deleteRepairLine(id: number) {
  return http.delete<boolean>(`/mes/dv/repair-line/delete?id=${id}`)
}
