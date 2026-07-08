import { http } from '@/http/http'

/** MES 转移单行 */
export interface WmTransferLine {
  id?: number
  transferId?: number
  materialStockId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitName?: string
  unitMeasureName?: string
  quantity?: number
  batchId?: number
  batchCode?: string
  fromWarehouseId?: number
  fromWarehouseName?: string
  fromLocationId?: number
  fromLocationName?: string
  fromAreaId?: number
  fromAreaName?: string
  remark?: string
  createTime?: Date
}

/** 查询转移单行列表 */
export function getTransferLineList(transferId: number) {
  return http.get<WmTransferLine[]>('/mes/wm/transfer-line/list', { transferId })
}

/** 查询转移单行详情 */
export function getTransferLine(id: number) {
  return http.get<WmTransferLine>(`/mes/wm/transfer-line/get?id=${id}`)
}

/** 新增转移单行 */
export function createTransferLine(data: WmTransferLine) {
  return http.post<number>('/mes/wm/transfer-line/create', data)
}

/** 修改转移单行 */
export function updateTransferLine(data: WmTransferLine) {
  return http.put<boolean>('/mes/wm/transfer-line/update', data)
}

/** 删除转移单行 */
export function deleteTransferLine(id: number) {
  return http.delete<boolean>(`/mes/wm/transfer-line/delete?id=${id}`)
}
