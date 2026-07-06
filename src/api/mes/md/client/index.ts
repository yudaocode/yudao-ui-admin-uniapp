import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 客户 */
export interface MdClient {
  id?: number
  code: string
  name: string
  nickname?: string | null
  englishName?: string | null
  description?: string | null
  logo?: string | null
  type: number
  address?: string | null
  website?: string | null
  email?: string | null
  telephone?: string | null
  contact1Name?: string | null
  contact1Telephone?: string | null
  contact1Email?: string | null
  contact2Name?: string | null
  contact2Telephone?: string | null
  contact2Email?: string | null
  creditCode?: string | null
  status: number
  remark?: string | null
  createTime?: Date
}

/** 查询客户分页 */
export function getClientPage(params: PageParam) {
  return http.get<PageResult<MdClient>>(`/mes/md-client/page`, params)
}

/** 查询客户详情 */
export function getClient(id: number) {
  return http.get<MdClient>(`/mes/md-client/get?id=${id}`)
}

/** 新增客户 */
export function createClient(data: MdClient) {
  return http.post<number>(`/mes/md-client/create`, data)
}

/** 修改客户 */
export function updateClient(data: MdClient) {
  return http.put<boolean>(`/mes/md-client/update`, data)
}

/** 删除客户 */
export function deleteClient(id: number) {
  return http.delete<boolean>(`/mes/md-client/delete?id=${id}`)
}

/** 导出客户 Excel */
export function exportClient(params: Record<string, any>) {
  return http.get<Blob>(`/mes/md-client/export-excel`, params)
}
