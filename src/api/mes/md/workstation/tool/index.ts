import { http } from '@/http/http'

/** MES 工装夹具资源 */
export interface MdWorkstationTool {
  id?: number
  workstationId: number // 工作站 ID
  toolTypeId: number // 工具类型 ID
  toolTypeName?: string // 工具类型名称
  quantity: number // 数量
  remark: string // 备注
}

/** 查询工装夹具资源列表 */
export function getWorkstationToolList(workstationId: number) {
  return http.get<MdWorkstationTool[]>(`/mes/md-workstation-tool/list-by-workstation?workstationId=${workstationId}`)
}

/** 新增工装夹具资源 */
export function createWorkstationTool(data: MdWorkstationTool) {
  return http.post<number>(`/mes/md-workstation-tool/create`, data)
}

/** 修改工装夹具资源 */
export function updateWorkstationTool(data: MdWorkstationTool) {
  return http.put<boolean>(`/mes/md-workstation-tool/update`, data)
}

/** 删除工装夹具资源 */
export function deleteWorkstationTool(id: number) {
  return http.delete<boolean>(`/mes/md-workstation-tool/delete?id=${id}`)
}
