import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 印章 */
export interface Seal {
  id: number // 印章编号
  no?: string // 印章编码
  name?: string // 印章名称
  type?: number // 印章类型，字典 oa_seal_type
  category?: number // 印章分类，字典 oa_seal_category
  deptId?: number // 所属部门编号
  deptName?: string // 所属部门
  keeperUserId?: number // 保管人用户编号
  keeperName?: string // 保管人
  keeperDeptId?: number // 保管部门编号
  keeperDeptName?: string // 保管部门
  status?: number // 印章台账状态，字典 oa_seal_status
  purchaseTime?: number | string // 购买时间
  enableTime?: number | string // 启用时间
  disableTime?: number | string // 停用时间
  picUrl?: string // 印章照片地址
  sort?: number // 显示顺序
  remark?: string // 备注
  createTime?: number // 创建时间
}

/** 获得印章分页 */
export function getSealPage(params: Record<string, any>) {
  return http.get<PageResult<Seal>>('/oa/seal/page', params)
}

/** 获得印章详情 */
export function getSeal(id: number) {
  return http.get<Seal>('/oa/seal/get', { id })
}

/** 创建印章 */
export function createSeal(data: Partial<Seal>) {
  return http.post<number>('/oa/seal/create', data)
}

/** 更新印章 */
export function updateSeal(data: Partial<Seal>) {
  return http.put<boolean>('/oa/seal/update', data)
}

/** 删除印章 */
export function deleteSeal(id: number) {
  return http.delete<boolean>(`/oa/seal/delete?id=${id}`)
}
