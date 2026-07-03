import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 供应商 */
export interface MdVendor {
  id?: number
  code: string
  name: string
  nickname: string | null
  englishName: string | null
  description: string | null
  logo: string | null
  level: string | null
  score?: number
  address: string | null
  website: string | null
  email: string | null
  telephone: string | null
  contact1Name: string | null
  contact1Telephone: string | null
  contact1Email: string | null
  contact2Name: string | null
  contact2Telephone: string | null
  contact2Email: string | null
  creditCode: string | null
  status: number
  remark: string | null
  createTime?: Date
}

/** 查询供应商分页 */
export function getVendorPage(params: PageParam) {
  return http.get<PageResult<MdVendor>>(`/mes/md-vendor/page`, params)
}

/** 查询供应商详情 */
export function getVendor(id: number) {
  return http.get<MdVendor>(`/mes/md-vendor/get?id=${id}`)
}

/** 新增供应商 */
export function createVendor(data: MdVendor) {
  return http.post<number>(`/mes/md-vendor/create`, data)
}

/** 修改供应商 */
export function updateVendor(data: MdVendor) {
  return http.put<boolean>(`/mes/md-vendor/update`, data)
}

/** 删除供应商 */
export function deleteVendor(id: number) {
  return http.delete<boolean>(`/mes/md-vendor/delete?id=${id}`)
}

/** 导出供应商 Excel */
export function exportVendor(params: Record<string, any>) {
  return http.get<Blob>(`/mes/md-vendor/export-excel`, params)
}
