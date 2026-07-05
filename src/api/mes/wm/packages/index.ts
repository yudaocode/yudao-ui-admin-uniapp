import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 装箱单 */
export interface WmPackage {
  id?: number
  code: string
  parentId?: number
  packageDate: string | Date
  salesOrderCode?: string
  invoiceCode?: string
  clientId?: number
  clientCode?: string
  clientName?: string
  clientNickname?: string
  length?: number
  width?: number
  height?: number
  sizeUnitId?: number
  sizeUnitName?: string
  netWeight?: number
  grossWeight?: number
  weightUnitId?: number
  weightUnitName?: string
  inspectorUserId?: number
  inspectorName?: string
  status?: number
  remark?: string
  createTime?: Date
}

/** 创建装箱单 */
export function createPackage(data: WmPackage) {
  return http.post<number>('/mes/wm/package/create', data)
}

/** 修改装箱单 */
export function updatePackage(data: WmPackage) {
  return http.put<boolean>('/mes/wm/package/update', data)
}

/** 删除装箱单 */
export function deletePackage(id: number) {
  return http.delete<boolean>(`/mes/wm/package/delete?id=${id}`)
}

/** 获取装箱单详情 */
export function getPackage(id: number) {
  return http.get<WmPackage>(`/mes/wm/package/get?id=${id}`)
}

/** 分页查询装箱单 */
export function getPackagePage(params: PageParam) {
  return http.get<PageResult<WmPackage>>('/mes/wm/package/page', params)
}

/** 完成装箱单 */
export function finishPackage(id: number) {
  return http.put<boolean>(`/mes/wm/package/finish?id=${id}`)
}

/** 添加子箱 */
export function addChildPackage(parentId: number, childId: number) {
  return http.put<boolean>('/mes/wm/package/add-child-package', undefined, { parentId, childId })
}

/** 移除子箱 */
export function removeChildPackage(childId: number) {
  return http.put<boolean>(`/mes/wm/package/remove-child-package?childId=${childId}`)
}
