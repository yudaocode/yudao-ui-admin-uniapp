import { http } from '@/http/http'

/** MES 供应商退货明细 */
export interface WmReturnVendorDetail {
  id?: number // 明细编号
  returnId: number // 退货单编号
  lineId: number // 退货单行编号
  materialStockId?: number // 库存记录编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  quantity: number // 拣货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  warehouseId?: number // 仓库编号
  warehouseName?: string // 仓库名称
  locationId?: number // 库区编号
  locationName?: string // 库区名称
  areaId?: number // 库位编号
  areaName?: string // 库位名称
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询供应商退货明细列表（按行编号） */
export function getReturnVendorDetailListByLineId(lineId: number) {
  return http.get<WmReturnVendorDetail[]>('/mes/wm/return-vendor-detail/list-by-line', { lineId })
}

/** 查询供应商退货明细详情 */
export function getReturnVendorDetail(id: number) {
  return http.get<WmReturnVendorDetail>(`/mes/wm/return-vendor-detail/get?id=${id}`)
}

/** 新增供应商退货明细 */
export function createReturnVendorDetail(data: WmReturnVendorDetail) {
  return http.post<number>('/mes/wm/return-vendor-detail/create', data)
}

/** 修改供应商退货明细 */
export function updateReturnVendorDetail(data: WmReturnVendorDetail) {
  return http.put<boolean>('/mes/wm/return-vendor-detail/update', data)
}

/** 删除供应商退货明细 */
export function deleteReturnVendorDetail(id: number) {
  return http.delete<boolean>(`/mes/wm/return-vendor-detail/delete?id=${id}`)
}
