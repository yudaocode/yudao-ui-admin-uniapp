import { http } from '@/http/http'

/** MES 人力资源 */
export interface MdWorkstationWorker {
  id?: number
  workstationId: number // 工作站 ID
  postId: number // 岗位 ID
  postName?: string // 岗位名称
  quantity: number // 数量
  remark: string // 备注
}

/** 查询人力资源列表 */
export function getWorkstationWorkerList(workstationId: number) {
  return http.get<MdWorkstationWorker[]>(`/mes/md-workstation-worker/list-by-workstation?workstationId=${workstationId}`)
}

/** 新增人力资源 */
export function createWorkstationWorker(data: MdWorkstationWorker) {
  return http.post<number>(`/mes/md-workstation-worker/create`, data)
}

/** 修改人力资源 */
export function updateWorkstationWorker(data: MdWorkstationWorker) {
  return http.put<boolean>(`/mes/md-workstation-worker/update`, data)
}

/** 删除人力资源 */
export function deleteWorkstationWorker(id: number) {
  return http.delete<boolean>(`/mes/md-workstation-worker/delete?id=${id}`)
}
