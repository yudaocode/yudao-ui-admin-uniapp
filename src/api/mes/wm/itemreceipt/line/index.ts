import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 采购入库单行 */
export interface WmItemReceiptLine {
  id?: number // 行编号
  receiptId: number // 入库单编号
  receiptCode?: string // 入库单编码
  purchaseOrderCode?: string // 采购订单号
  arrivalNoticeLineId?: number // 到货通知单行编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位
  receivedQuantity: number // 入库数量
  batchId?: number // 批次编号
  batchCode?: string // 批次编码
  productionDate?: string // 生产日期
  expireDate?: string // 有效期
  lotNumber?: string // 生产批号
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询采购入库单行分页 */
export function getItemReceiptLinePage(params: PageParam) {
  return http.get<PageResult<WmItemReceiptLine>>('/mes/wm/item-receipt-line/page', params)
}

/** 查询采购入库单行详情 */
export function getItemReceiptLine(id: number) {
  return http.get<WmItemReceiptLine>(`/mes/wm/item-receipt-line/get?id=${id}`)
}

/** 新增采购入库单行 */
export function createItemReceiptLine(data: WmItemReceiptLine) {
  return http.post<number>('/mes/wm/item-receipt-line/create', data)
}

/** 修改采购入库单行 */
export function updateItemReceiptLine(data: WmItemReceiptLine) {
  return http.put<boolean>('/mes/wm/item-receipt-line/update', data)
}

/** 删除采购入库单行 */
export function deleteItemReceiptLine(id: number) {
  return http.delete<boolean>(`/mes/wm/item-receipt-line/delete?id=${id}`)
}
