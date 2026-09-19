import { http } from '@/http/http'
import type { PageResult } from '@/http/types'
import type { Seal } from '@/api/oa/seal'

/** OA 用印申请 */
export interface SealApply {
  id: number // 申请编号
  no?: string // 申请单号
  sealId?: number // 印章编号
  sealNo?: string // 印章编码
  sealName?: string // 印章名称
  reason?: string // 用印事由
  type?: number // 用印类型，字典 oa_seal_apply_type
  mode?: number // 用印方式，字典 oa_seal_use_mode
  documentTitle?: string // 文件标题
  documentType?: string // 文件类型
  documentCount?: number // 文件份数
  contractPrice?: number // 合同金额（元）
  contractParty?: string // 合同对方
  expectedUseTime?: number | string // 预计用印时间
  expectedReturnTime?: number | string // 预计归还时间
  actualUseTime?: number | string // 实际用印时间
  actualReturnTime?: number | string // 实际归还时间
  urgent?: boolean // 是否紧急
  remark?: string // 备注
  fileUrls?: string[] // 附件地址列表
  userId?: number // 申请人编号
  userName?: string // 申请人
  deptId?: number // 申请部门编号
  deptName?: string // 申请部门
  sealType?: number // 印章类型快照，字典 oa_seal_type
  keeperUserId?: number // 保管人编号
  keeperName?: string // 保管人
  keeperDeptId?: number // 保管部门编号
  keeperDeptName?: string // 保管部门
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  useStatus?: number // 用印状态，字典 oa_seal_use_status
  processInstanceId?: string // 流程实例编号
  createTime?: number // 创建时间
}

/** 获得本人用印申请分页 */
export function getSealApplyPage(params: Record<string, any>) {
  return http.get<PageResult<SealApply>>('/oa/seal-apply/page', params)
}

/** 获得用印申请详情 */
export function getSealApply(id: number) {
  return http.get<SealApply>('/oa/seal-apply/get', { id })
}

/** 获得可申请的印章分页 */
export function getAvailableSealPage(params: Record<string, any>) {
  return http.get<PageResult<Seal>>('/oa/seal-apply/seal-page', params)
}

/** 创建用印申请草稿 */
export function createSealApply(data: Partial<SealApply>) {
  return http.post<number>('/oa/seal-apply/create', data)
}

/** 更新用印申请草稿 */
export function updateSealApply(data: Partial<SealApply>) {
  return http.put<boolean>('/oa/seal-apply/update', data)
}

/** 删除用印申请草稿 */
export function deleteSealApply(id: number) {
  return http.delete<boolean>(`/oa/seal-apply/delete?id=${id}`)
}

/** 提交用印申请 */
export function submitSealApply(id: number) {
  return http.put<boolean>(`/oa/seal-apply/submit?id=${id}`)
}

/** 撤销用印申请 */
export function cancelSealApply(id: number) {
  return http.put<boolean>(`/oa/seal-apply/cancel?id=${id}`)
}
