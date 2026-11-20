import type { Task } from '@/api/bpm/task'
import type { ProcessDefinition } from '@/api/bpm/definition'
import type { PageParam, PageResult } from '@/http/types'
import type {
  BpmCandidateStrategyEnum,
  BpmNodeTypeEnum,
} from '@/utils/constants'
import { http } from '@/http/http'
/** 流程实例用户信息 */
export interface User {
  id: number
  nickname: string
  avatar?: string
  deptName?: string
}
export type { ProcessDefinition } from '@/api/bpm/definition'

/** 流程实例 */
export interface ProcessInstance {
  id: string
  name: string
  status: number
  category?: string
  categoryName?: string
  createTime?: Date
  startTime?: Date
  endTime?: Date
  startUser?: User
  businessKey?: string
  formVariables?: Record<string, any>
  processDefinition?: ProcessDefinition
  tasks?: { id: string, name: string }[]
  summary?: {
    key: string
    value: string
  }[]
}

/** 审批详情 */
export interface ApprovalDetail {
  processInstance: ProcessInstance
  processDefinition: ProcessDefinition
  activityNodes: ApprovalNodeInfo[]
  todoTask?: Task
  formFieldsPermission?: Record<string, string>
  status?: number
  revisionTaskId?: string // 退回修改中的任务编号：当前用户是修改人时返回
  revisionId?: string // 退回修改的批次编号：重新提交时传递
}

/** 审批详情的节点信息 */
export interface ApprovalNodeInfo {
  candidateStrategy?: BpmCandidateStrategyEnum
  candidateUsers?: User[]
  endTime?: Date
  id: string
  name: string
  nodeType: BpmNodeTypeEnum
  startTime?: Date
  status: number
  processInstanceId?: string
  tasks: ApprovalTaskInfo[]
}

/** 审批详情的节点的任务 */
export interface ApprovalTaskInfo {
  id: number
  assigneeUser: User
  ownerUser: User
  reason: string
  attachments?: string[]
  signPicUrl: string
  status: number
  revisionTargetNode?: string // 退回修改的目标节点
  revisionTargetNodeName?: string // 退回修改的目标节点名称
  revisionAssigneeUser?: User // 退回修改的处理人
}

/** 抄送流程实例 */
export interface ProcessInstanceCopy {
  id: string
  processInstanceId: string
  processInstanceName: string
  startUser: User
  createTime: Date
  summary?: {
    key: string
    value: string
  }[]
}

/** 查询我发起的流程分页列表 */
export function getProcessInstanceMyPage(params: PageParam) {
  return http.get<PageResult<ProcessInstance>>('/bpm/process-instance/my-page', params)
}

/** 查询抄送我的流程分页列表 */
export function getProcessInstanceCopyPage(params: PageParam) {
  return http.get<PageResult<ProcessInstanceCopy>>('/bpm/process-instance/copy/page', params)
}

/** 查询流程实例详情 */
export function getProcessInstance(id: string) {
  return http.get<ProcessInstance>(`/bpm/process-instance/get?id=${id}`)
}

/** 获取审批详情 */
export function getApprovalDetail(params: { processDefinitionId?: string, processInstanceId?: string, activityId?: string, taskId?: string, processVariablesStr?: string }) {
  return http.get<ApprovalDetail>('/bpm/process-instance/get-approval-detail', params)
}

/** 新增流程实例 */
export function createProcessInstance(data: {
  processDefinitionId: string
  variables: Record<string, any>
  startUserSelectAssignees?: Record<string, number[]>
}) {
  return http.post<string>('/bpm/process-instance/create', data)
}

/** 申请人取消流程实例 */
export function cancelProcessInstanceByStartUser(id: string, reason: string) {
  return http.delete<boolean>('/bpm/process-instance/cancel-by-start-user', { id, reason })
}

/** 查询管理员流程实例分页 */
export function getProcessInstanceManagerPage(params: PageParam) {
  return http.get<PageResult<ProcessInstance>>('/bpm/process-instance/manager-page', params)
}

/** 管理员取消流程实例 */
export function cancelProcessInstanceByAdmin(id: string, reason: string) {
  return http.delete<boolean>('/bpm/process-instance/cancel-by-admin', { id, reason })
}

/** 获取下一个节点审批人 */
export function getNextApproveNodes(params: { processInstanceId?: string, taskId?: string, processVariablesStr?: string }) {
  return http.get<ApprovalNodeInfo[]>('/bpm/process-instance/get-next-approval-nodes', params)
}
