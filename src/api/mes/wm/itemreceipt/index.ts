import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 采购入库单 */
export interface WmItemReceipt {
  id?: number // 入库单编号
  code?: string // 入库单编码
  name?: string // 入库单名称
  iqcId?: number // 来料检验单编号
  iqcCode?: string // 来料检验单编码
  noticeId?: number // 到货通知单编号
  noticeCode?: string // 到货通知单编码
  purchaseOrderCode?: string // 采购订单号
  vendorId?: number // 供应商编号
  vendorName?: string // 供应商名称
  receiptDate?: string | number | Date // 入库日期
  status?: number // 单据状态
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询采购入库单分页 */
export function getItemReceiptPage(params: PageParam) {
  return http.get<PageResult<WmItemReceipt>>('/mes/wm/item-receipt/page', params)
}

/** 查询采购入库单详情 */
export function getItemReceipt(id: number) {
  return http.get<WmItemReceipt>(`/mes/wm/item-receipt/get?id=${id}`)
}

/** 新增采购入库单 */
export function createItemReceipt(data: WmItemReceipt) {
  return http.post<number>('/mes/wm/item-receipt/create', data)
}

/** 修改采购入库单 */
export function updateItemReceipt(data: WmItemReceipt) {
  return http.put<boolean>('/mes/wm/item-receipt/update', data)
}

/** 删除采购入库单 */
export function deleteItemReceipt(id: number) {
  return http.delete<boolean>(`/mes/wm/item-receipt/delete?id=${id}`)
}

/** 提交采购入库单 */
export function submitItemReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/item-receipt/submit?id=${id}`)
}

/** 执行上架 */
export function stockItemReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/item-receipt/stock?id=${id}`)
}

/** 执行入库 */
export function finishItemReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/item-receipt/finish?id=${id}`)
}

/** 取消采购入库单 */
export function cancelItemReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/item-receipt/cancel?id=${id}`)
}

/** 导出采购入库单 Excel */
export function exportItemReceipt(params: Record<string, any>) {
  return http.get<Blob>('/mes/wm/item-receipt/export-excel', params)
}
