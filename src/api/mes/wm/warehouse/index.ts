import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 仓库 */
export interface WmWarehouse {
  id?: number
  code: string
  name: string
  address: string | null
  area: number | null
  chargeUserId?: number
  chargeUserName?: string
  frozen: boolean
  remark: string | null
  createTime?: Date
}

/** 查询仓库分页 */
export function getWarehousePage(params: PageParam) {
  return http.get<PageResult<WmWarehouse>>(`/mes/wm/warehouse/page`, params)
}

/** 查询仓库精简列表 */
export function getWarehouseSimpleList() {
  return http.get<WmWarehouse[]>(`/mes/wm/warehouse/simple-list`)
}

/** 查询仓库详情 */
export function getWarehouse(id: number) {
  return http.get<WmWarehouse>(`/mes/wm/warehouse/get?id=${id}`)
}

/** 新增仓库 */
export function createWarehouse(data: WmWarehouse) {
  return http.post<number>(`/mes/wm/warehouse/create`, data)
}

/** 修改仓库 */
export function updateWarehouse(data: WmWarehouse) {
  return http.put<boolean>(`/mes/wm/warehouse/update`, data)
}

/** 删除仓库 */
export function deleteWarehouse(id: number) {
  return http.delete<boolean>(`/mes/wm/warehouse/delete?id=${id}`)
}
