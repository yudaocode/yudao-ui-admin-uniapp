import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产工序 */
export interface ProProcess {
  id?: number // 编号
  code: string // 工序编码
  name: string // 工序名称
  attention?: string // 工序说明
  status: number // 状态
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询生产工序列表分页 */
export function getProcessPage(params: PageParam) {
  return http.get<PageResult<ProProcess>>('/mes/pro/process/page', params)
}

/** 查询生产工序精简列表 */
export function getProcessSimpleList() {
  return http.get<ProProcess[]>('/mes/pro/process/simple-list')
}

/** 查询生产工序详情 */
export function getProcess(id: number) {
  return http.get<ProProcess>(`/mes/pro/process/get?id=${id}`)
}

/** 新增生产工序 */
export function createProcess(data: ProProcess) {
  return http.post<number>('/mes/pro/process/create', data)
}

/** 修改生产工序 */
export function updateProcess(data: ProProcess) {
  return http.put<boolean>('/mes/pro/process/update', data)
}

/** 删除生产工序 */
export function deleteProcess(id: number) {
  return http.delete<boolean>(`/mes/pro/process/delete?id=${id}`)
}
