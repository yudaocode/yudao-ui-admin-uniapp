import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 公文发文 */
export interface OfficialDocSend {
  id: number // 发文编号
  no?: string // 单据编号
  documentNo?: string // 公文文号
  templateId?: number // 套红模板编号
  title?: string // 公文标题
  noPrefix?: string // 字号
  year?: number // 年份
  sequence?: number // 第几号文
  secrecyLevel?: number // 密级，字典 oa_official_doc_secret_level
  urgencyLevel?: number // 紧急程度，字典 oa_official_doc_urgency_level
  disclosureType?: number // 公开类别，字典 oa_official_doc_public_category
  issueTime?: number | string // 发文日期
  sendDeptId?: number // 发文部门编号
  sendDeptName?: string // 发文部门
  mainDeptIds?: number[] // 主送部门编号列表
  mainDeptNames?: string[] // 主送部门
  copyDeptIds?: number[] // 抄送部门编号列表
  copyDeptNames?: string[] // 抄送部门
  signerUserId?: number // 签发人编号
  signerName?: string // 签发人
  content?: string // 公文正文
  fileUrls?: string[] // 附件地址列表
  formalFileUrl?: string // 正式公文地址
  remark?: string // 附注
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  processInstanceId?: string // 流程实例编号
  createTime?: number // 创建时间
}

/** 获得公文发文分页 */
export function getOfficialDocSendPage(params: Record<string, any>) {
  return http.get<PageResult<OfficialDocSend>>('/oa/officialdoc-send/page', params)
}

/** 获得公文发文详情 */
export function getOfficialDocSend(id: number) {
  return http.get<OfficialDocSend>('/oa/officialdoc-send/get', { id })
}

/** 创建公文发文 */
export function createOfficialDocSend(data: Partial<OfficialDocSend>) {
  return http.post<number>('/oa/officialdoc-send/create', data)
}

/** 更新公文发文 */
export function updateOfficialDocSend(data: Partial<OfficialDocSend>) {
  return http.put<boolean>('/oa/officialdoc-send/update', data)
}

/** 删除公文发文 */
export function deleteOfficialDocSend(id: number) {
  return http.delete<boolean>(`/oa/officialdoc-send/delete?id=${id}`)
}

/** 提交公文发文审批 */
export function submitOfficialDocSend(id: number) {
  return http.post<boolean>(`/oa/officialdoc-send/submit?id=${id}`)
}

/** 撤销公文发文审批 */
export function cancelOfficialDocSend(id: number) {
  return http.put<boolean>(`/oa/officialdoc-send/cancel?id=${id}`)
}
