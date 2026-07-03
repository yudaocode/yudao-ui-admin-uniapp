import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 质检缺陷记录 */
export interface QcDefectRecord {
  id?: number // 编号
  qcType: number // 检验类型
  qcId: number // 检验单 ID
  lineId: number // 检验行 ID
  name: string // 缺陷描述
  level: number // 缺陷等级
  quantity?: number // 缺陷数量
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询质检缺陷记录分页 */
export function getDefectRecordPage(params: PageParam) {
  return http.get<PageResult<QcDefectRecord>>('/mes/qc/defect-record/page', params)
}

/** 新增质检缺陷记录 */
export function createDefectRecord(data: QcDefectRecord) {
  return http.post<number>('/mes/qc/defect-record/create', data)
}

/** 修改质检缺陷记录 */
export function updateDefectRecord(data: QcDefectRecord) {
  return http.put<boolean>('/mes/qc/defect-record/update', data)
}

/** 删除质检缺陷记录 */
export function deleteDefectRecord(id: number) {
  return http.delete<boolean>(`/mes/qc/defect-record/delete?id=${id}`)
}
