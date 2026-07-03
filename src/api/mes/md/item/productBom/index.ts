import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 产品 BOM（查询返回） */
export interface MdProductBom {
  id?: number // BOM 编号
  itemId: number // 物料产品 ID
  bomItemId: number // BOM 物料 ID
  quantity: number // 物料使用比例
  status?: number // 是否启用
  remark?: string // 备注
  createTime?: Date // 创建时间
  // 关联展示字段
  bomItemCode?: string // BOM 物料编码
  bomItemName?: string // BOM 物料名称
  bomItemSpecification?: string // BOM 物料规格
  unitMeasureName?: string // 计量单位名称
  itemOrProduct?: string // 产品物料标识
}

/** 创建产品 BOM */
export function createProductBom(data: MdProductBom) {
  return http.post<number>(`/mes/md/product-bom/create`, data)
}

/** 更新产品 BOM */
export function updateProductBom(data: MdProductBom) {
  return http.put<boolean>(`/mes/md/product-bom/update`, data)
}

/** 删除产品 BOM */
export function deleteProductBom(id: number) {
  return http.delete<boolean>(`/mes/md/product-bom/delete?id=${id}`)
}

/** 获得产品 BOM */
export function getProductBom(id: number) {
  return http.get<MdProductBom>(`/mes/md/product-bom/get?id=${id}`)
}

/** 获得产品 BOM 分页 */
export function getProductBomPage(params: PageParam) {
  return http.get<PageResult<MdProductBom>>(`/mes/md/product-bom/page`, params)
}

/** 根据物料产品编号获得产品 BOM 列表 */
export function getProductBomListByItemId(itemId: number) {
  return http.get<MdProductBom[]>(`/mes/md/product-bom/list-by-item-id?itemId=${itemId}`)
}
