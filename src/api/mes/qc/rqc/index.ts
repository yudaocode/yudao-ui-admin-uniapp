import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 退货检验单 */
export interface QcRqc {
  id?: number // 编号
  code: string // 检验单编号
  name: string // 检验单名称
  templateId?: number // 检验模板 ID
  sourceDocType?: number // 来源单据类型
  sourceDocId?: number // 来源单据 ID
  sourceLineId?: number // 来源单据行 ID
  sourceDocCode?: string // 来源单据编码
  type: number // 检验类型
  itemId: number // 产品物料 ID
  itemCode?: string // 产品物料编码（关联查询）
  itemName?: string // 产品物料名称（关联查询）
  itemSpecification?: string // 规格型号（关联查询）
  unitName?: string // 单位名称（关联查询）
  batchCode?: string // 批次号
  checkQuantity: number // 检测数量
  qualifiedQuantity: number // 合格品数量
  unqualifiedQuantity: number // 不合格数量
  checkResult?: number // 检测结果
  inspectDate: string | Date // 检测日期
  inspectorUserId: number // 检测人员用户 ID
  inspectorNickname?: string // 检测人员昵称（关联查询）
  status?: number // 状态
  remark?: string // 备注
  criticalRate?: number // 致命缺陷率（%）
  majorRate?: number // 严重缺陷率（%）
  minorRate?: number // 轻微缺陷率（%）
  criticalQuantity?: number // 致命缺陷数量
  majorQuantity?: number // 严重缺陷数量
  minorQuantity?: number // 轻微缺陷数量
  createTime?: Date // 创建时间
}

/** 查询退货检验单分页 */
export function getRqcPage(params: PageParam) {
  return http.get<PageResult<QcRqc>>(`/mes/qc/rqc/page`, params)
}

/** 查询退货检验单详情 */
export function getRqc(id: number) {
  return http.get<QcRqc>(`/mes/qc/rqc/get?id=${id}`)
}

/** 新增退货检验单 */
export function createRqc(data: QcRqc) {
  return http.post<number>(`/mes/qc/rqc/create`, data)
}

/** 修改退货检验单 */
export function updateRqc(data: QcRqc) {
  return http.put<boolean>(`/mes/qc/rqc/update`, data)
}

/** 完成退货检验单 */
export function finishRqc(id: number) {
  return http.put<boolean>(`/mes/qc/rqc/finish?id=${id}`)
}

/** 删除退货检验单 */
export function deleteRqc(id: number) {
  return http.delete<boolean>(`/mes/qc/rqc/delete?id=${id}`)
}

/** 导出退货检验单 Excel */
export function exportRqc(params: Record<string, any>) {
  return http.get<Blob>(`/mes/qc/rqc/export-excel`, params)
}
