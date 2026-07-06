import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 质检指标 */
export interface QcIndicator {
  id?: number // 编号
  code: string // 检测项编码
  name: string // 检测项名称
  type?: number // 检测项类型
  tool?: string // 检测工具
  resultType?: number // 结果值类型
  resultSpecification?: string // 结果值属性
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询质检指标分页 */
export function getIndicatorPage(params: PageParam) {
  return http.get<PageResult<QcIndicator>>(`/mes/qc/indicator/page`, params)
}

/** 查询质检指标详情 */
export function getIndicator(id: number) {
  return http.get<QcIndicator>(`/mes/qc/indicator/get?id=${id}`)
}

/** 新增质检指标 */
export function createIndicator(data: QcIndicator) {
  return http.post<number>(`/mes/qc/indicator/create`, data)
}

/** 修改质检指标 */
export function updateIndicator(data: QcIndicator) {
  return http.put<boolean>(`/mes/qc/indicator/update`, data)
}

/** 删除质检指标 */
export function deleteIndicator(id: number) {
  return http.delete<boolean>(`/mes/qc/indicator/delete?id=${id}`)
}

/** 导出质检指标 Excel */
export function exportIndicator(params: Record<string, any>) {
  return http.get<Blob>(`/mes/qc/indicator/export-excel`, params)
}
