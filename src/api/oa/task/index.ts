import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OA 任务接收人 */
export interface TaskReceiver {
  id: number // 编号
  userId: number // 接收人用户编号
  userName?: string // 接收人昵称
  deptName?: string // 接收人部门名称
  status: number // 接收状态
  updateTime?: string // 更新时间
}

/** OA 任务反馈日志 */
export interface TaskLog {
  id: number // 编号
  userId: number // 反馈人用户编号
  userName?: string // 反馈人昵称
  status: number // 变更后的状态
  content?: string // 反馈内容
  createTime?: string // 反馈时间
}

/** OA 任务 */
export interface Task {
  id?: number // 任务编号
  publisherUserId?: number // 发布人用户编号
  publisherUserName?: string // 发布人昵称
  publisherDeptName?: string // 发布人部门名称
  type: number // 任务类型
  status: number // 总体状态
  receiverStatus?: number // 当前接收人的状态
  title: string // 标题
  description: string // 任务描述
  comment?: string // 任务评价
  startTime: string // 开始时间
  endTime: string // 结束时间
  top: boolean // 是否置顶
  canceled: boolean // 是否取消
  receivers?: TaskReceiver[] // 接收人列表，分页和详情均返回
  logs?: TaskLog[] // 反馈日志列表，仅详情返回
  receiverUserIds?: number[] // 接收人用户编号列表，保存时提交
  publishTime?: string // 发布时间
  createTime?: string // 创建时间
  updateTime?: string // 修改时间
}

/** 查询我发布的任务分页 */
export function getPublishedTaskPage(params: PageParam) {
  return http.get<PageResult<Task>>('/oa/task/published-page', params)
}

/** 查询我的任务分页 */
export function getReceivedTaskPage(params: PageParam) {
  return http.get<PageResult<Task>>('/oa/task/received-page', params)
}

/** 查询任务详情，发布人或接收人可访问 */
export function getTask(id: number) {
  return http.get<Task>(`/oa/task/get?id=${id}`)
}

/** 创建任务 */
export function createTask(data: Task) {
  return http.post<number>('/oa/task/create', data)
}

/** 更新任务 */
export function updateTask(data: Task) {
  return http.put<boolean>('/oa/task/update', data)
}

/** 删除发布的任务 */
export function deleteTask(id: number) {
  return http.delete<boolean>(`/oa/task/delete?id=${id}`)
}

/** 删除接收的任务：仅取消后可删除自己的接收关系 */
export function deleteReceivedTask(id: number) {
  return http.delete<boolean>(`/oa/task/delete-received?id=${id}`)
}

/** 创建任务反馈：接收人只能反馈到已提交，发布人可调整总体状态 */
export function feedbackTask(data: { taskId: number, publisher: boolean, status: number, content?: string }) {
  return http.post<boolean>('/oa/task/feedback', data)
}

/** OA 任务完成排行 */
export interface TaskRanking {
  userId: number // 用户编号
  userName?: string // 用户昵称
  completedCount: number // 已完成任务数
}

/** 查询本人任务按状态的数量统计 */
export function getTaskStatusCount() {
  return http.get<Record<number, number>>('/oa/task/get-status-count')
}

/** 查询按发布人的已完成任务排行 */
export function getCompletedTaskRanking() {
  return http.get<TaskRanking[]>('/oa/task/get-completed-ranking')
}
