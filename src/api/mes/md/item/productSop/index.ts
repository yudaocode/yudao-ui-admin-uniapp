import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 产品 SOP（查询/详情返回） */
export interface MdProductSop {
  id?: number // SOP 编号
  itemId: number // 物料产品 ID
  sort: number // 排列顺序
  processId?: number // 工序 ID
  title: string // 标题
  description?: string // 详细描述
  url?: string // 图片地址
  remark?: string // 备注
  createTime?: Date // 创建时间
  // ========== 关联展示字段 ==========
  processCode?: string // 工序编号
  processName?: string // 工序名称
}

/** 创建产品SOP */
export function createProductSop(data: MdProductSop) {
  return http.post<number>(`/mes/md/product-sop/create`, data)
}

/** 更新产品SOP */
export function updateProductSop(data: MdProductSop) {
  return http.put<boolean>(`/mes/md/product-sop/update`, data)
}

/** 删除产品SOP */
export function deleteProductSop(id: number) {
  return http.delete<boolean>(`/mes/md/product-sop/delete?id=${id}`)
}

/** 获得产品SOP */
export function getProductSop(id: number) {
  return http.get<MdProductSop>(`/mes/md/product-sop/get?id=${id}`)
}

/** 获得产品SOP分页 */
export function getProductSopPage(params: PageParam) {
  return http.get<PageResult<MdProductSop>>(`/mes/md/product-sop/page`, params)
}

/** 根据物料产品编号获得产品SOP列表 */
export function getProductSopListByItemId(itemId: number) {
  return http.get<MdProductSop[]>(`/mes/md/product-sop/list-by-item-id?itemId=${itemId}`)
}
