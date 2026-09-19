import { OA_TASK_STATUS } from './constants'

/** 获得任务状态进度（状态值 1~5 对应 20~100） */
export function getTaskStatusProgress(status?: number) {
  const statuses: number[] = Object.values(OA_TASK_STATUS)
  return status !== undefined && statuses.includes(status) ? status * 20 : 0
}
