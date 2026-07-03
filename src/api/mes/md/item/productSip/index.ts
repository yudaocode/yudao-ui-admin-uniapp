import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 产品 SIP（查询返回） */
export interface MdProductSip {
  id?: number // SIP 编号
  itemId: number // 物料产品 ID
  sort: number // 排列顺序
  processId: number | null // 工序 ID
  title: string // 标题
  description: string | null // 详细描述
  url: string | null // 图片地址
  remark: string | null // 备注
  createTime?: Date // 创建时间
  processCode?: string // 工序编号
  processName?: string // 工序名称
}

/** 创建产品 SIP（返回 ID） */
export function createProductSip(data: MdProductSip) {
  return http.post<number>(`/mes/md/product-sip/create`, data)
}

/** 更新产品 SIP */
export function updateProductSip(data: MdProductSip) {
  return http.put<boolean>(`/mes/md/product-sip/update`, data)
}

/** 删除产品 SIP */
export function deleteProductSip(id: number) {
  return http.delete<boolean>(`/mes/md/product-sip/delete?id=${id}`)
}

/** 获得产品 SIP */
export function getProductSip(id: number) {
  return http.get<MdProductSip>(`/mes/md/product-sip/get?id=${id}`)
}

/** 获得产品 SIP 分页 */
export function getProductSipPage(params: PageParam) {
  return http.get<PageResult<MdProductSip>>(`/mes/md/product-sip/page`, params)
}

/** 根据物料产品编号获得产品 SIP 列表 */
export function getProductSipListByItemId(itemId: number) {
  return http.get<MdProductSip[]>(`/mes/md/product-sip/list-by-item-id?itemId=${itemId}`)
}
