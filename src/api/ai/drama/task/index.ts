import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 短剧生成任务 */
export interface DramaTask {
  type: number // 任务类型，参见 ai_drama_task_type 字典
  id: number // 编号：对应任务类型的记录编号
  projectId: number // 项目编号
  projectName?: string // 项目名称
  userId?: number // 用户编号
  userNickname?: string // 用户昵称
  title?: string // 标题
  status: number // 状态，参见 AiDramaStatusEnum
  errorMessage?: string // 错误信息
  prompt?: string // 提示词
  modelId?: number // 模型编号
  taskId?: string // 服务商任务编号
  resultUrl?: string // 结果地址
  timeout?: boolean // 是否已超时
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
}

/** AI 短剧生成任务操作请求：重新提交、同步状态、标记失败 */
export interface DramaTaskActionReq {
  type: number // 任务类型
  id: number // 编号
}

/** 获得生成任务分页 */
export function getDramaTaskPage(params: PageParam) {
  return http.get<PageResult<DramaTask>>('/ai/drama/task/page', params)
}

/** 重新提交任务 */
export function resubmitDramaTask(data: DramaTaskActionReq) {
  return http.put<boolean>('/ai/drama/task/resubmit', data)
}

/** 同步任务状态 */
export function syncDramaTask(data: DramaTaskActionReq) {
  return http.put<boolean>('/ai/drama/task/sync', data)
}

/** 标记任务失败 */
export function updateDramaTaskFail(data: DramaTaskActionReq) {
  return http.put<boolean>('/ai/drama/task/update-fail', data)
}
