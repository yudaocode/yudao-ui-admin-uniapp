import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产任务 */
export interface ProTask {
  id?: number // 编号
  code?: string // 任务编码
  name?: string // 任务名称
  workOrderId?: number // 生产工单编号
  workOrderCode?: string // 工单编码
  workOrderName?: string // 工单名称
  workstationId?: number // 工作站编号
  workstationCode?: string // 工作站编码
  workstationName?: string // 工作站名称
  routeId?: number // 工艺路线编号
  processId?: number // 工序编号
  processName?: string // 工序名称
  itemId?: number // 产品物料编号
  itemName?: string // 产品名称
  itemCode?: string // 产品编码
  itemSpecification?: string // 规格型号
  unitMeasureName?: string // 计量单位
  quantity?: number // 排产数量
  producedQuantity?: number // 已生产数量
  qualifyQuantity?: number // 合格品数量
  unqualifyQuantity?: number // 不良品数量
  changedQuantity?: number // 调整数量
  clientId?: number // 客户编号
  clientName?: string // 客户名称
  startTime?: Date // 开始生产时间
  duration?: number // 生产时长（工作日）
  endTime?: Date // 结束生产时间
  colorCode?: string // 甘特图显示颜色
  requestDate?: Date // 需求日期
  finishDate?: Date // 完成日期
  cancelDate?: Date // 取消日期
  status?: number // 任务状态
  checkFlag?: boolean // 是否质检
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** MES 甘特图任务 */
export interface ProTaskGantt {
  id: string
  originalId?: number
  text?: string
  type?: number
  parent?: string
  process?: string
  workstation?: string
  product?: string
  quantity?: number
  startDate?: Date
  endDate?: Date
  duration?: number
  progress?: number
  color?: string
}

/** 查询生产任务分页 */
export function getTaskPage(params: PageParam) {
  return http.get<PageResult<ProTask>>('/mes/pro/task/page', params)
}

/** 查询生产任务详情 */
export function getTask(id: number) {
  return http.get<ProTask>(`/mes/pro/task/get?id=${id}`)
}

/** 新增生产任务 */
export function createTask(data: ProTask) {
  return http.post<number>('/mes/pro/task/create', data)
}

/** 修改生产任务 */
export function updateTask(data: ProTask) {
  return http.put<boolean>('/mes/pro/task/update', data)
}

/** 删除生产任务 */
export function deleteTask(id: number) {
  return http.delete<boolean>(`/mes/pro/task/delete?id=${id}`)
}

/** 导出生产任务 Excel */
export function exportTask(params: Record<string, any>) {
  return http.get<Blob>('/mes/pro/task/export-excel', params)
}

/** 获得甘特图任务列表 */
export function getGanttTaskList(params: Record<string, any>) {
  return http.get<ProTaskGantt[]>('/mes/pro/task/gantt-list', params)
}
