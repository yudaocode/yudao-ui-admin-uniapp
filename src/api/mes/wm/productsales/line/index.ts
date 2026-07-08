import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 销售出库单行 */
export interface WmProductSalesLine {
  id?: number // 行编号
  salesId?: number // 销售出库单编号
  noticeLineId?: number // 发货通知单行编号
  itemId?: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  quantity?: number // 出库数量
  pickedQuantity?: number // 已拣货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  oqcCheckFlag?: boolean // 是否检验
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询销售出库单行分页 */
export function getProductSalesLinePage(params: PageParam) {
  return http.get<PageResult<WmProductSalesLine>>('/mes/wm/product-sales-line/page', params)
}

/** 查询销售出库单行详情 */
export function getProductSalesLine(id: number) {
  return http.get<WmProductSalesLine>(`/mes/wm/product-sales-line/get?id=${id}`)
}

/** 新增销售出库单行 */
export function createProductSalesLine(data: WmProductSalesLine) {
  return http.post<number>('/mes/wm/product-sales-line/create', data)
}

/** 修改销售出库单行 */
export function updateProductSalesLine(data: WmProductSalesLine) {
  return http.put<boolean>('/mes/wm/product-sales-line/update', data)
}

/** 删除销售出库单行 */
export function deleteProductSalesLine(id: number) {
  return http.delete<boolean>(`/mes/wm/product-sales-line/delete?id=${id}`)
}
