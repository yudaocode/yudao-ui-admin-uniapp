import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 公文收文 */
export interface OfficialDocReceive {
  id: number // 收文编号
  no?: string // 单据编号
  title?: string // 公文标题
  documentNo?: string // 来文字号
  sendId?: number // 来源发文编号
  creator?: string // 创建人，发文生效自动投递的收文为空
  sendDeptName?: string // 发文部门
  issueTime?: number | string // 发文日期
  signerName?: string // 签发人
  disclosureType?: number // 公开类别，字典 oa_official_doc_public_category
  secrecyLevel?: number // 密级，字典 oa_official_doc_secret_level
  urgencyLevel?: number // 紧急程度，字典 oa_official_doc_urgency_level
  receiveType?: number // 收文类型，字典 oa_official_doc_receive_type
  receiveTime?: number | string // 收文时间
  receiveDeptId?: number // 收文部门编号
  receiveDeptName?: string // 收文部门
  handlerUserId?: number // 主办人用户编号
  handlerName?: string // 主办人
  instruction?: string // 领导批示
  result?: string // 办理结果
  deadlineTime?: number | string // 办理期限
  summary?: string // 内容摘要
  remark?: string // 备注
  fileUrls?: string[] // 附件地址列表
  formalFileUrl?: string // 正式公文地址
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  handleStatus?: number // 办理状态，字典 oa_official_doc_handle_status
  processInstanceId?: string // 流程实例编号
  createTime?: number // 创建时间
}

/** 获得公文收文分页 */
export function getOfficialDocReceivePage(params: Record<string, any>) {
  return http.get<PageResult<OfficialDocReceive>>('/oa/officialdoc-receive/page', params)
}

/** 获得公文收文详情 */
export function getOfficialDocReceive(id: number) {
  return http.get<OfficialDocReceive>('/oa/officialdoc-receive/get', { id })
}

/** 创建公文收文 */
export function createOfficialDocReceive(data: Partial<OfficialDocReceive>) {
  return http.post<number>('/oa/officialdoc-receive/create', data)
}

/** 更新公文收文 */
export function updateOfficialDocReceive(data: Partial<OfficialDocReceive>) {
  return http.put<boolean>('/oa/officialdoc-receive/update', data)
}

/** 删除公文收文 */
export function deleteOfficialDocReceive(id: number) {
  return http.delete<boolean>(`/oa/officialdoc-receive/delete?id=${id}`)
}

/** 提交公文收文审批 */
export function submitOfficialDocReceive(id: number) {
  return http.post<boolean>(`/oa/officialdoc-receive/submit?id=${id}`)
}

/** 撤销公文收文审批 */
export function cancelOfficialDocReceive(id: number) {
  return http.put<boolean>(`/oa/officialdoc-receive/cancel?id=${id}`)
}

/** 签收公文收文 */
export function claimOfficialDocReceive(id: number) {
  return http.put<boolean>(`/oa/officialdoc-receive/claim?id=${id}`)
}
