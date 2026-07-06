import { http } from '@/http/http'

/** MES 工艺路线产品 */
export interface ProRouteProduct {
  id?: number // 编号
  routeId: number // 工艺路线编号
  itemId?: number // 产品物料编号
  itemCode?: string // 产品编码
  itemName?: string // 产品名称
  specification?: string // 规格型号
  unitName?: string // 单位名称
  quantity?: number // 生产数量
  productionTime?: number // 生产用时
  timeUnitType?: string // 时间单位
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 按工艺路线查询产品列表 */
export function getRouteProductListByRoute(routeId: number) {
  return http.get<ProRouteProduct[]>(`/mes/pro/route-product/list-by-route?routeId=${routeId}`)
}

/** 查询工艺路线产品详情 */
export function getRouteProduct(id: number) {
  return http.get<ProRouteProduct>(`/mes/pro/route-product/get?id=${id}`)
}

/** 新增工艺路线产品 */
export function createRouteProduct(data: ProRouteProduct) {
  return http.post<number>('/mes/pro/route-product/create', data)
}

/** 修改工艺路线产品 */
export function updateRouteProduct(data: ProRouteProduct) {
  return http.put<boolean>('/mes/pro/route-product/update', data)
}

/** 删除工艺路线产品 */
export function deleteRouteProduct(id: number) {
  return http.delete<boolean>(`/mes/pro/route-product/delete?id=${id}`)
}
