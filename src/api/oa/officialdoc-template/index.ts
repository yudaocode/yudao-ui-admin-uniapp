import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 公文套红模板 */
export interface OfficialDocTemplate {
  id: number // 模板编号
  name?: string // 模板名称
  authorityName?: string // 红头名称
  fontSize?: number // 红头字号
  noPrefix?: string // 发文字号前缀
  sealPicUrl?: string // 印章图片地址
  separatorType?: number // 分隔线类型，字典 oa_official_doc_separator_type
  status?: number // 状态，0 正常 1 停用
  sort?: number // 显示顺序
  remark?: string // 备注
  createTime?: number // 创建时间
}

/** 获得套红模板分页 */
export function getOfficialDocTemplatePage(params: Record<string, any>) {
  return http.get<PageResult<OfficialDocTemplate>>('/oa/officialdoc-template/page', params)
}

/** 获得套红模板精简列表 */
export function getSimpleOfficialDocTemplateList() {
  return http.get<OfficialDocTemplate[]>('/oa/officialdoc-template/simple-list')
}

/** 获得套红模板详情 */
export function getOfficialDocTemplate(id: number) {
  return http.get<OfficialDocTemplate>('/oa/officialdoc-template/get', { id })
}

/** 创建套红模板 */
export function createOfficialDocTemplate(data: Partial<OfficialDocTemplate>) {
  return http.post<number>('/oa/officialdoc-template/create', data)
}

/** 更新套红模板 */
export function updateOfficialDocTemplate(data: Partial<OfficialDocTemplate>) {
  return http.put<boolean>('/oa/officialdoc-template/update', data)
}

/** 删除套红模板 */
export function deleteOfficialDocTemplate(id: number) {
  return http.delete<boolean>(`/oa/officialdoc-template/delete?id=${id}`)
}
