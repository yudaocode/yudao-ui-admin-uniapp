import { http } from '@/http/http'

/** WMS 商品分类 */
export interface ItemCategory {
  id?: number
  parentId?: number
  code?: string
  name?: string
  sort?: number
  status?: number
  createTime?: Date
}

/** 查询商品分类列表 */
export function getItemCategoryList(params?: Record<string, any>) {
  return http.get<ItemCategory[]>('/wms/item-category/list', params)
}

/** 查询商品分类精简列表 */
export function getSimpleItemCategoryList() {
  return http.get<ItemCategory[]>('/wms/item-category/simple-list')
}

/** 查询商品分类详情 */
export function getItemCategory(id: number) {
  return http.get<ItemCategory>(`/wms/item-category/get?id=${id}`)
}

/** 新增商品分类 */
export function createItemCategory(data: ItemCategory) {
  return http.post<number>('/wms/item-category/create', data)
}

/** 修改商品分类 */
export function updateItemCategory(data: ItemCategory) {
  return http.put<boolean>('/wms/item-category/update', data)
}

/** 删除商品分类 */
export function deleteItemCategory(id: number) {
  return http.delete<boolean>(`/wms/item-category/delete?id=${id}`)
}
