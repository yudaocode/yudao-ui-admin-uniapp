import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 外协入库单 */
export interface WmOutsourceReceipt {
  id?: number // 入库单编号
  code?: string // 入库单编码
  name?: string // 入库单名称
  workOrderId?: number // 外协工单编号
  workOrderCode?: string // 外协工单编码
  workOrderName?: string // 外协工单名称
  vendorId?: number // 供应商编号
  vendorName?: string // 供应商名称
  receiptDate?: string | number | Date // 入库日期
  status?: number // 单据状态
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询外协入库单分页 */
export function getOutsourceReceiptPage(params: PageParam) {
  return http.get<PageResult<WmOutsourceReceipt>>('/mes/wm/outsource-receipt/page', params)
}

/** 查询外协入库单详情 */
export function getOutsourceReceipt(id: number) {
  return http.get<WmOutsourceReceipt>(`/mes/wm/outsource-receipt/get?id=${id}`)
}

/** 新增外协入库单 */
export function createOutsourceReceipt(data: WmOutsourceReceipt) {
  return http.post<number>('/mes/wm/outsource-receipt/create', data)
}

/** 修改外协入库单 */
export function updateOutsourceReceipt(data: WmOutsourceReceipt) {
  return http.put<boolean>('/mes/wm/outsource-receipt/update', data)
}

/** 删除外协入库单 */
export function deleteOutsourceReceipt(id: number) {
  return http.delete<boolean>(`/mes/wm/outsource-receipt/delete?id=${id}`)
}

/** 提交外协入库单 */
export function submitOutsourceReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/outsource-receipt/submit?id=${id}`)
}

/** 入库上架 */
export function stockOutsourceReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/outsource-receipt/stock?id=${id}`)
}

/** 完成外协入库单 */
export function finishOutsourceReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/outsource-receipt/finish?id=${id}`)
}

/** 取消外协入库单 */
export function cancelOutsourceReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/outsource-receipt/cancel?id=${id}`)
}

/** 导出外协入库单 Excel */
export function exportOutsourceReceipt(params: Record<string, any>) {
  return http.get<Blob>('/mes/wm/outsource-receipt/export-excel', params)
}
