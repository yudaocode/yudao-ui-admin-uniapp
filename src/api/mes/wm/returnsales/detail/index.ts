import { http } from '@/http/http'

/** MES 销售退货上架明细 */
export interface WmReturnSalesDetail {
  id?: number // 明细编号
  returnId?: number // 退货单编号
  lineId?: number // 行编号
  itemId?: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  itemSpecification?: string // 规格型号
  itemUnit?: string // 单位名称
  quantity?: number // 数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  warehouseId?: number // 仓库编号
  warehouseCode?: string // 仓库编码
  warehouseName?: string // 仓库名称
  locationId?: number // 库区编号
  locationCode?: string // 库区编码
  locationName?: string // 库区名称
  areaId?: number // 库位编号
  areaCode?: string // 库位编码
  areaName?: string // 库位名称
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询销售退货明细列表（按行编号） */
export function getReturnSalesDetailListByLineId(lineId: number) {
  return http.get<WmReturnSalesDetail[]>('/mes/wm/return-sales-detail/list-by-line', { lineId })
}

/** 查询销售退货明细详情 */
export function getReturnSalesDetail(id: number) {
  return http.get<WmReturnSalesDetail>(`/mes/wm/return-sales-detail/get?id=${id}`)
}

/** 新增销售退货明细 */
export function createReturnSalesDetail(data: WmReturnSalesDetail) {
  return http.post<number>('/mes/wm/return-sales-detail/create', data)
}

/** 修改销售退货明细 */
export function updateReturnSalesDetail(data: WmReturnSalesDetail) {
  return http.put<boolean>('/mes/wm/return-sales-detail/update', data)
}

/** 删除销售退货明细 */
export function deleteReturnSalesDetail(id: number) {
  return http.delete<boolean>(`/mes/wm/return-sales-detail/delete?id=${id}`)
}
