import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 点检保养项目 */
export interface DvSubject {
  id?: number
  code: string
  name?: string
  type: number
  content: string
  standard?: string
  status: number
  remark?: string
  createTime?: Date
}

/** 查询点检保养项目分页 */
export function getSubjectPage(params: PageParam) {
  return http.get<PageResult<DvSubject>>(`/mes/dv/subject/page`, params)
}

/** 查询点检保养项目详情 */
export function getSubject(id: number) {
  return http.get<DvSubject>(`/mes/dv/subject/get?id=${id}`)
}

/** 新增点检保养项目 */
export function createSubject(data: DvSubject) {
  return http.post<number>(`/mes/dv/subject/create`, data)
}

/** 修改点检保养项目 */
export function updateSubject(data: DvSubject) {
  return http.put<boolean>(`/mes/dv/subject/update`, data)
}

/** 删除点检保养项目 */
export function deleteSubject(id: number) {
  return http.delete<boolean>(`/mes/dv/subject/delete?id=${id}`)
}

/** 导出点检保养项目 Excel */
export function exportSubject(params: Record<string, any>) {
  return http.get<Blob>(`/mes/dv/subject/export-excel`, params)
}
