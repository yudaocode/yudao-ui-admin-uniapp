import type { ProcessInstance } from '@/api/bpm/processInstance'
import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 任务处理人 */
export interface TaskUser {
  id: number
  nickname: string
  avatar?: string
  deptName?: string
}

/** 操作按钮设置 */
export interface OperationButtonSetting {
  displayName: string // 按钮名称
  enable: boolean // 是否启用
}

/** 流程任务 */
export interface Task {
  id: string
  name: string
  status: number
  createTime: Date
  endTime?: Date
  durationInMillis?: number // 持续时间
  reason?: string
  assigneeUser?: TaskUser
  ownerUser?: TaskUser
  processInstanceId?: string // 流程实例 ID
  processInstance: ProcessInstance
  reasonRequire?: boolean // 是否填写审批意见
  signEnable?: boolean // 是否需要签名
  formId?: number // 节点表单 ID
  formConf?: string // 节点表单配置
  formFields?: string[] // 节点表单字段
  formVariables?: Record<string, any> // 节点表单变量
  buttonsSetting?: Record<number, OperationButtonSetting> // 按钮设置
  children?: Task[] // 由加签生成，包含多层子任务
  revisionId?: string // 退回修改的批次编号
}

/** 退回修改后，重新提交的请求 */
export interface TaskResubmitReq {
  taskId: string // 任务编号
  revisionId: string // 退回修改的批次编号，来自审批详情
  variables: Record<string, any> // 修改的表单变量，只能包含退回目标节点可编辑的字段
}

/** 查询待办任务分页列表 */
export function getTaskTodoPage(params: PageParam) {
  return http.get<PageResult<Task>>('/bpm/task/todo-page', params)
}

/** 查询待我修改的任务分页列表 */
export function getTaskRevisionPage(params: PageParam) {
  return http.get<PageResult<Task>>('/bpm/task/revision-page', params)
}

/** 退回修改后，重新提交 */
export function resubmitTask(data: TaskResubmitReq) {
  return http.put<boolean>('/bpm/task/resubmit', data)
}

/** 查询已办任务分页列表 */
export function getTaskDonePage(params: PageParam) {
  return http.get<PageResult<Task>>('/bpm/task/done-page', params)
}

/** 审批通过 */
export function approveTask(data: {
  id: string
  reason: string
  attachments?: string[]
  variables?: Record<string, any> // 审批通过时修改的流程变量
  signPicUrl?: string // 签名图片 URL
  nextAssignees?: Record<string, number[]> // 下一个节点审批人
  revisionId?: string // 退回修改的批次编号，避免使用修改前的页面审批
}) {
  return http.put<boolean>('/bpm/task/approve', data)
}

/** 审批拒绝 */
export function rejectTask(data: { id: string, reason: string, attachments?: string[], revisionId?: string }) {
  return http.put<boolean>('/bpm/task/reject', data)
}

/** 根据流程实例 ID 查询任务列表 */
export function getTaskListByProcessInstanceId(processInstanceId: string) {
  return http.get<Task[]>(`/bpm/task/list-by-process-instance-id?processInstanceId=${processInstanceId}`)
}

/** 查询任务管理分页 */
export function getTaskManagerPage(params: PageParam) {
  return http.get<PageResult<Task>>('/bpm/task/manager-page', params)
}

/** 委派任务 */
export function delegateTask(data: { id: string, delegateUserId: number, reason: string }) {
  return http.put<boolean>('/bpm/task/delegate', data)
}

/** 转办任务 */
export function transferTask(data: { id: string, assigneeUserId: number, reason: string }) {
  return http.put<boolean>('/bpm/task/transfer', data)
}

/** 退回任务 */
export function returnTask(data: { id: string, targetTaskDefinitionKey: string, reason: string }) {
  return http.put<boolean>('/bpm/task/return', data)
}

/** 获取可退回的节点列表 */
export function getTaskListByReturn(taskId: string) {
  return http.get<any[]>(`/bpm/task/list-by-return?id=${taskId}`)
}

/** 加签任务 */
export function signCreateTask(data: { id: string, type: string, userIds: number[], reason: string }) {
  return http.put<boolean>('/bpm/task/create-sign', data)
}

/** 减签任务 */
export function signDeleteTask(data: { id: string, reason: string }) {
  return http.delete<boolean>('/bpm/task/delete-sign', data)
}

/** 抄送任务 */
export function copyTask(data: { id: string, copyUserIds: number[], reason: string }) {
  return http.put<boolean>('/bpm/task/copy', data)
}

/** 撤回任务 */
export function withdrawTask(taskId: string) {
  return http.put<boolean>('/bpm/task/withdraw', undefined, { taskId })
}
