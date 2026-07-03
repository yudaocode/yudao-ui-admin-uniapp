import { http } from '@/http/http'

/** MES 生产工序内容 */
export interface ProProcessContent {
  id?: number // 编号
  processId: number // 工序编号
  sort: number // 顺序编号
  content?: string // 步骤说明
  device?: string // 辅助设备
  material?: string // 辅助材料
  docUrl?: string // 材料文档 URL
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询工序内容列表（按工序编号） */
export function getProcessContentListByProcessId(processId: number) {
  return http.get<ProProcessContent[]>(`/mes/pro/process-content/list-by-process?processId=${processId}`)
}

/** 查询工序内容详情 */
export function getProcessContent(id: number) {
  return http.get<ProProcessContent>(`/mes/pro/process-content/get?id=${id}`)
}

/** 新增工序内容 */
export function createProcessContent(data: ProProcessContent) {
  return http.post<number>('/mes/pro/process-content/create', data)
}

/** 修改工序内容 */
export function updateProcessContent(data: ProProcessContent) {
  return http.put<boolean>('/mes/pro/process-content/update', data)
}

/** 删除工序内容 */
export function deleteProcessContent(id: number) {
  return http.delete<boolean>(`/mes/pro/process-content/delete?id=${id}`)
}
