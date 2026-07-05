import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 库区 */
export interface WmWarehouseLocation {
  id?: number
  code: string
  name: string
  warehouseId?: number
  warehouseName?: string
  area?: number | null
  frozen: boolean
  remark: string | null
  createTime?: Date
}

/** 查询库区分页 */
export function getWarehouseLocationPage(params: PageParam) {
  return http.get<PageResult<WmWarehouseLocation>>(`/mes/wm/warehouse-location/page`, params)
}

/** 查询库区精简列表 */
export function getWarehouseLocationSimpleList(warehouseId?: number) {
  return http.get<WmWarehouseLocation[]>(`/mes/wm/warehouse-location/simple-list`, { warehouseId })
}

/** 查询库区详情 */
export function getWarehouseLocation(id: number) {
  return http.get<WmWarehouseLocation>(`/mes/wm/warehouse-location/get?id=${id}`)
}

/** 新增库区 */
export function createWarehouseLocation(data: WmWarehouseLocation) {
  return http.post<number>(`/mes/wm/warehouse-location/create`, data)
}

/** 修改库区 */
export function updateWarehouseLocation(data: WmWarehouseLocation) {
  return http.put<boolean>(`/mes/wm/warehouse-location/update`, data)
}

/** 根据库区修改库位混放配置 */
export function updateAreaByLocationId(locationId: number, allowItemMixing?: boolean, allowBatchMixing?: boolean) {
  return http.put<boolean>(`/mes/wm/warehouse-location/update-by-location-id`, undefined, {
    allowBatchMixing,
    allowItemMixing,
    locationId,
  })
}

/** 删除库区 */
export function deleteWarehouseLocation(id: number) {
  return http.delete<boolean>(`/mes/wm/warehouse-location/delete?id=${id}`)
}
