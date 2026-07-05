import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 过程检验单 */
export interface QcIpqc {
  id?: number // 编号
  code: string // 检验单编号
  name: string // 检验单名称
  type: number // IPQC 检验类型
  templateId?: number // 检验模板 ID
  sourceDocType?: number // 来源单据类型
  sourceDocId?: number // 来源单据 ID
  sourceLineId?: number // 来源单据行 ID
  sourceDocCode?: string // 来源单据编号
  workOrderId: number // 生产工单 ID
  workOrderCode?: string // 工单编号（关联查询）
  workOrderName?: string // 工单名称（关联查询）
  taskId?: number // 生产任务 ID
  taskCode?: string // 生产任务编号（待检任务带入）
  workstationId: number // 工位 ID
  workstationCode?: string // 工位编号（关联查询）
  workstationName?: string // 工位名称（关联查询）
  processId?: number // 工序 ID
  processName?: string // 工序名称（关联查询）
  itemId?: number // 产品物料 ID
  itemCode?: string // 产品物料编码（关联查询）
  itemName?: string // 产品物料名称（关联查询）
  itemSpecification?: string // 规格型号（关联查询）
  unitName?: string // 单位名称（关联查询）
  checkQuantity: number // 检测数量
  qualifiedQuantity: number // 合格品数量
  unqualifiedQuantity: number // 不合格品数量
  laborScrapQuantity: number // 工废数量
  materialScrapQuantity: number // 料废数量
  otherScrapQuantity: number // 其他废品数量
  criticalRate?: number // 致命缺陷率（%）
  majorRate?: number // 严重缺陷率（%）
  minorRate?: number // 轻微缺陷率（%）
  criticalQuantity?: number // 致命缺陷数量
  majorQuantity?: number // 严重缺陷数量
  minorQuantity?: number // 轻微缺陷数量
  checkResult?: number // 检测结果
  inspectDate: string | Date // 检测日期
  inspectorUserId: number // 检测人员用户 ID
  inspectorNickname?: string // 检测人员昵称（关联查询）
  status?: number // 状态
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询过程检验单分页 */
export function getIpqcPage(params: PageParam) {
  return http.get<PageResult<QcIpqc>>(`/mes/qc/ipqc/page`, params)
}

/** 查询过程检验单详情 */
export function getIpqc(id: number) {
  return http.get<QcIpqc>(`/mes/qc/ipqc/get?id=${id}`)
}

/** 新增过程检验单 */
export function createIpqc(data: QcIpqc) {
  return http.post<number>(`/mes/qc/ipqc/create`, data)
}

/** 修改过程检验单 */
export function updateIpqc(data: QcIpqc) {
  return http.put<boolean>(`/mes/qc/ipqc/update`, data)
}

/** 完成过程检验单 */
export function finishIpqc(id: number) {
  return http.put<boolean>(`/mes/qc/ipqc/finish?id=${id}`)
}

/** 删除过程检验单 */
export function deleteIpqc(id: number) {
  return http.delete<boolean>(`/mes/qc/ipqc/delete?id=${id}`)
}

/** 导出过程检验单 Excel */
export function exportIpqc(params: Record<string, any>) {
  return http.get<Blob>(`/mes/qc/ipqc/export-excel`, params)
}
