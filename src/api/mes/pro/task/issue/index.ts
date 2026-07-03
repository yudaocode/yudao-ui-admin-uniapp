import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产任务投料 */
export interface ProTaskIssue {
  id?: number // 编号
  taskId: number // 生产任务编号
  workOrderId: number // 生产工单编号
  workstationId: number // 工作站编号
  sourceDocType: string // 来源单据类型
  sourceDocId: number // 来源单据编号
  sourceLineId: number // 来源单据行编号
  sourceDocCode: string // 来源单据编码
  batchCode: string // 投料批次
  itemId: number // 产品物料编号
  itemName?: string // 产品名称
  itemCode?: string // 产品编码
  itemSpecification?: string // 规格型号
  unitMeasureId: number // 单位编号
  unitMeasureName?: string // 单位名称
  issuedQuantity: number // 总投料数量
  availableQuantity: number // 当前可用数量
  usedQuantity: number // 当前使用数量
  remark: string // 备注
  createTime?: Date // 创建时间
}

/** 查询生产任务投料分页 */
export function getTaskIssuePage(params: PageParam) {
  return http.get<PageResult<ProTaskIssue>>('/mes/pro/task-issue/page', params)
}

/** 查询生产任务投料详情 */
export function getTaskIssue(id: number) {
  return http.get<ProTaskIssue>(`/mes/pro/task-issue/get?id=${id}`)
}

/** 新增生产任务投料 */
export function createTaskIssue(data: ProTaskIssue) {
  return http.post<number>('/mes/pro/task-issue/create', data)
}

/** 修改生产任务投料 */
export function updateTaskIssue(data: ProTaskIssue) {
  return http.put<boolean>('/mes/pro/task-issue/update', data)
}

/** 删除生产任务投料 */
export function deleteTaskIssue(id: number) {
  return http.delete<boolean>(`/mes/pro/task-issue/delete?id=${id}`)
}

/** 按任务查询投料列表 */
export function getTaskIssueListByTask(taskId: number) {
  return http.get<ProTaskIssue[]>(`/mes/pro/task-issue/list-by-task?taskId=${taskId}`)
}
