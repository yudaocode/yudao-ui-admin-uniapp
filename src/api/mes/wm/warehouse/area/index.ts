import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 库位 */
export interface WmWarehouseArea {
  id?: number
  code: string
  name: string
  warehouseId?: number
  warehouseName?: string
  locationId: number
  locationName?: string
  area: number | null
  maxLoad: number | null
  positionX: number | null
  positionY: number | null
  positionZ: number | null
  status: number
  frozen: boolean
  allowItemMixing: boolean
  allowBatchMixing: boolean
  remark: string | null
  createTime?: Date
}

/** 查询库位分页 */
export function getWarehouseAreaPage(params: PageParam) {
  return http.get<PageResult<WmWarehouseArea>>(`/mes/wm/warehouse-area/page`, params)
}

/** 查询库位精简列表 */
export function getWarehouseAreaSimpleList(locationId?: number) {
  return http.get<WmWarehouseArea[]>(`/mes/wm/warehouse-area/simple-list`, { locationId })
}

/** 查询库位详情 */
export function getWarehouseArea(id: number) {
  return http.get<WmWarehouseArea>(`/mes/wm/warehouse-area/get?id=${id}`)
}

/** 新增库位 */
export function createWarehouseArea(data: WmWarehouseArea) {
  return http.post<number>(`/mes/wm/warehouse-area/create`, data)
}

/** 修改库位 */
export function updateWarehouseArea(data: WmWarehouseArea) {
  return http.put<boolean>(`/mes/wm/warehouse-area/update`, data)
}

/** 删除库位 */
export function deleteWarehouseArea(id: number) {
  return http.delete<boolean>(`/mes/wm/warehouse-area/delete?id=${id}`)
}
