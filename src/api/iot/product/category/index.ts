import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT 产品分类信息 */
export interface ProductCategory {
  id?: number
  name: string
  sort: number
  status: number
  description?: string
  createTime?: Date
}

/** 获取产品分类分页列表 */
export function getProductCategoryPage(params: PageParam) {
  return http.get<PageResult<ProductCategory>>('/iot/product-category/page', params)
}

/** 获取产品分类详情 */
export function getProductCategory(id: number) {
  return http.get<ProductCategory>(`/iot/product-category/get?id=${id}`)
}

/** 创建产品分类 */
export function createProductCategory(data: ProductCategory) {
  return http.post<number>('/iot/product-category/create', data)
}

/** 更新产品分类 */
export function updateProductCategory(data: ProductCategory) {
  return http.put<boolean>('/iot/product-category/update', data)
}

/** 删除产品分类 */
export function deleteProductCategory(id: number) {
  return http.delete<boolean>(`/iot/product-category/delete?id=${id}`)
}

/** 获取产品分类精简列表 */
export function getSimpleProductCategoryList() {
  return http.get<ProductCategory[]>('/iot/product-category/simple-list')
}
