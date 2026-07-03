import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 检验结果 */
export interface QcIndicatorResult {
  id?: number // 编号
  code?: string // 样品编号
  qcId: number // 关联质检单ID
  qcType: number // 质检类型
  itemId?: number // 产品物料ID
  sn?: string // 物资SN
  remark?: string // 备注
  createTime?: Date // 创建时间
  items?: QcIndicatorResultDetail[] // 检验结果明细列表
}

/** MES 检验结果明细 */
export interface QcIndicatorResultDetail {
  id?: number // 编号
  resultId?: number // 关联检验结果ID
  indicatorId?: number // 检测指标ID
  value?: string // 检测值（统一存为字符串）
  remark?: string // 备注
  indicatorName?: string // 检测指标名称
  valueType?: number // 质检值类型
  valueSpecification?: string // 值属性
}

/** 查询检验结果分页 */
export function getResultPage(params: PageParam) {
  return http.get<PageResult<QcIndicatorResult>>('/mes/qc/indicator-result/page', params)
}

/** 查询检验结果明细（含检测项模板）：编辑传 id，新增不传 */
export function getDetail(qcId: number, qcType: number, id?: number) {
  return http.get<QcIndicatorResult>('/mes/qc/indicator-result/get-detail', { id, qcId, qcType })
}

/** 新增检验结果 */
export function createResult(data: QcIndicatorResult) {
  return http.post<number>('/mes/qc/indicator-result/create', data)
}

/** 修改检验结果 */
export function updateResult(data: QcIndicatorResult) {
  return http.put<boolean>('/mes/qc/indicator-result/update', data)
}

/** 删除检验结果 */
export function deleteResult(id: number) {
  return http.delete<boolean>(`/mes/qc/indicator-result/delete?id=${id}`)
}
