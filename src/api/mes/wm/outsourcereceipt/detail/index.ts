import { http } from '@/http/http'

/** MES 外协入库上架明细 */
export interface WmOutsourceReceiptDetail {
  id?: number // 明细编号
  lineId?: number // 入库单行编号
  receiptId?: number // 入库单编号
  itemId?: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位
  quantity?: number // 上架数量
  batchId?: number // 批次编号
  warehouseId?: number // 仓库编号
  warehouseName?: string // 仓库名称
  locationId?: number // 库区编号
  locationName?: string // 库区名称
  areaId?: number // 库位编号
  areaName?: string // 库位名称
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询外协入库上架明细列表（按行编号） */
export function getOutsourceReceiptDetailListByLineId(lineId: number) {
  return http.get<WmOutsourceReceiptDetail[]>('/mes/wm/outsource-receipt-detail/list-by-line', { lineId })
}

/** 查询外协入库上架明细详情 */
export function getOutsourceReceiptDetail(id: number) {
  return http.get<WmOutsourceReceiptDetail>(`/mes/wm/outsource-receipt-detail/get?id=${id}`)
}

/** 新增外协入库上架明细 */
export function createOutsourceReceiptDetail(data: WmOutsourceReceiptDetail) {
  return http.post<number>('/mes/wm/outsource-receipt-detail/create', data)
}

/** 修改外协入库上架明细 */
export function updateOutsourceReceiptDetail(data: WmOutsourceReceiptDetail) {
  return http.put<boolean>('/mes/wm/outsource-receipt-detail/update', data)
}

/** 删除外协入库上架明细 */
export function deleteOutsourceReceiptDetail(id: number) {
  return http.delete<boolean>(`/mes/wm/outsource-receipt-detail/delete?id=${id}`)
}
