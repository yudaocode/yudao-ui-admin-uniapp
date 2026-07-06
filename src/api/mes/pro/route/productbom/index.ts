import { http } from '@/http/http'

/** MES 工艺路线产品 BOM */
export interface ProRouteProductBom {
  id?: number // 编号
  routeId: number // 工艺路线编号
  processId?: number // 工序编号
  productId: number // 产品物料编号
  itemId?: number // BOM 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitName?: string // 单位名称
  quantity?: number // 用料比例
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询工艺路线产品 BOM 列表 */
export function getRouteProductBomList(params: {
  routeId: number
  processId?: number
  productId?: number
}) {
  return http.get<ProRouteProductBom[]>(`/mes/pro/route-product-bom/list`, params)
}

/** 查询工艺路线产品 BOM 详情 */
export function getRouteProductBom(id: number) {
  return http.get<ProRouteProductBom>(`/mes/pro/route-product-bom/get?id=${id}`)
}

/** 新增工艺路线产品 BOM */
export function createRouteProductBom(data: ProRouteProductBom) {
  return http.post<number>('/mes/pro/route-product-bom/create', data)
}

/** 修改工艺路线产品 BOM */
export function updateRouteProductBom(data: ProRouteProductBom) {
  return http.put<boolean>('/mes/pro/route-product-bom/update', data)
}

/** 删除工艺路线产品 BOM */
export function deleteRouteProductBom(id: number) {
  return http.delete<boolean>(`/mes/pro/route-product-bom/delete?id=${id}`)
}
