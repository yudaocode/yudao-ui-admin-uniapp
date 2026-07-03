import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 供应商退货单行 */
export interface WmReturnVendorLine {
  id?: number // 行编号
  returnId: number // 退货单编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  quantity: number // 退货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询供应商退货单行分页 */
export function getReturnVendorLinePage(params: PageParam) {
  return http.get<PageResult<WmReturnVendorLine>>('/mes/wm/return-vendor-line/page', params)
}

/** 查询供应商退货单行列表 */
export function getReturnVendorLineListByReturnId(returnId: number) {
  return http.get<WmReturnVendorLine[]>(`/mes/wm/return-vendor-line/list-by-return-vendor?returnId=${returnId}`)
}

/** 查询供应商退货单行详情 */
export function getReturnVendorLine(id: number) {
  return http.get<WmReturnVendorLine>(`/mes/wm/return-vendor-line/get?id=${id}`)
}

/** 新增供应商退货单行 */
export function createReturnVendorLine(data: WmReturnVendorLine) {
  return http.post<number>('/mes/wm/return-vendor-line/create', data)
}

/** 修改供应商退货单行 */
export function updateReturnVendorLine(data: WmReturnVendorLine) {
  return http.put<boolean>('/mes/wm/return-vendor-line/update', data)
}

/** 删除供应商退货单行 */
export function deleteReturnVendorLine(id: number) {
  return http.delete<boolean>(`/mes/wm/return-vendor-line/delete?id=${id}`)
}
