import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 办公用品 */
export interface SupplyItem {
  id: number // 用品编号
  deptId?: number // 所属部门编号
  deptName?: string // 所属部门名称
  name?: string // 物品名称
  no?: string // 物品编码
  category?: number // 类别，字典 oa_supply_category
  manageType?: number // 管理类型，字典 oa_supply_manage_type
  model?: string // 规格型号
  unit?: string // 计量单位
  referencePrice?: number // 参考单价（元）
  stockQuantity?: number // 库存数量
  minStockQuantity?: number // 最低库存预警
  picUrl?: string // 物品图片
  status?: number // 状态，0 正常 1 停用
  sort?: number // 排序
  remark?: string // 备注
  createTime?: number // 创建时间
}

/** 获得办公用品分页 */
export function getSupplyItemPage(params: Record<string, any>) {
  return http.get<PageResult<SupplyItem>>('/oa/supply-item/page', params)
}

/** 获得可领用的办公用品分页 */
export function getSupplyItemSelectPage(params: Record<string, any>) {
  return http.get<PageResult<SupplyItem>>('/oa/supply-item/select-page', params)
}

/** 获得办公用品详情 */
export function getSupplyItem(id: number) {
  return http.get<SupplyItem>('/oa/supply-item/get', { id })
}

/** 创建办公用品 */
export function createSupplyItem(data: Partial<SupplyItem>) {
  return http.post<number>('/oa/supply-item/create', data)
}

/** 更新办公用品 */
export function updateSupplyItem(data: Partial<SupplyItem>) {
  return http.put<boolean>('/oa/supply-item/update', data)
}

/** 删除办公用品 */
export function deleteSupplyItem(id: number) {
  return http.delete<boolean>(`/oa/supply-item/delete?id=${id}`)
}

/** 办公用品入库 */
export function stockInSupplyItem(data: { id: number, quantity: number }) {
  return http.put<boolean>('/oa/supply-item/stock-in', data)
}
