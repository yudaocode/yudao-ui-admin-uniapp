import { http } from '@/http/http'

/** PMS 工作项评论 */
export interface WorkItemComment {
  id?: number // 评论编号
  workItemId: number // 工作项编号
  userId?: number // 评论人用户编号
  userName?: string // 评论人姓名
  mainId?: number // 主评论编号
  replyUserId?: number // 回复对象用户编号
  replyUserName?: string // 回复对象姓名
  content: string // 评论内容
  children?: WorkItemComment[] // 回复列表
  createTime?: number // 创建时间
}

/** 查询工作项评论列表 */
export function getWorkItemCommentList(workItemId: number) {
  return http.get<WorkItemComment[]>('/pms/pm/work-item-comment/list', { workItemId })
}

/** 新增工作项评论 */
export function createWorkItemComment(data: Partial<WorkItemComment>) {
  return http.post<number>('/pms/pm/work-item-comment/create', data)
}

/** 修改工作项评论 */
export function updateWorkItemComment(data: Partial<WorkItemComment>) {
  return http.put<boolean>('/pms/pm/work-item-comment/update', data)
}

/** 删除工作项评论 */
export function deleteWorkItemComment(id: number) {
  return http.delete<boolean>('/pms/pm/work-item-comment/delete', undefined, { id })
}
