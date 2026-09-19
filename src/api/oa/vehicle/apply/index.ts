import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 用车申请 */
export interface VehicleApply {
  id: number // 申请编号
  no?: string // 申请单号
  vehicleId?: number // 车辆编号
  vehicleNo?: string // 车牌号
  userId?: number // 申请人编号
  userName?: string // 申请人姓名
  deptId?: number // 申请部门编号
  deptName?: string // 申请部门名称
  startTime?: number | string // 预计出车时间
  endTime?: number | string // 预计回车时间
  startLocation?: string // 出车地点
  endLocation?: string // 预计回车地点
  reason?: string // 用车事由
  passenger?: string // 随行人
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  returnStatus?: number // 还车状态，字典 oa_vehicle_return_status
  processInstanceId?: string // 流程实例编号
  remark?: string // 备注
  fileUrls?: string[] // 附件地址列表
  createTime?: number // 创建时间
}

/** 获得本人用车申请分页 */
export function getVehicleApplyPage(params: Record<string, any>) {
  return http.get<PageResult<VehicleApply>>('/oa/vehicle-apply/page', params)
}

/** 获得用车申请详情 */
export function getVehicleApply(id: number) {
  return http.get<VehicleApply>('/oa/vehicle-apply/get', { id })
}

/** 获得用车申请可选的车辆分页 */
export function getAvailableVehiclePage(params: Record<string, any>) {
  return http.get<PageResult<{ id: number, no: string, name?: string, status?: number }>>('/oa/vehicle-apply/vehicle-page', params)
}

/** 创建用车申请草稿 */
export function createVehicleApply(data: Partial<VehicleApply>) {
  return http.post<number>('/oa/vehicle-apply/create', data)
}

/** 更新用车申请草稿 */
export function updateVehicleApply(data: Partial<VehicleApply>) {
  return http.put<boolean>('/oa/vehicle-apply/update', data)
}

/** 删除用车申请草稿 */
export function deleteVehicleApply(id: number) {
  return http.delete<boolean>(`/oa/vehicle-apply/delete?id=${id}`)
}

/** 提交用车申请 */
export function submitVehicleApply(id: number) {
  return http.put<boolean>(`/oa/vehicle-apply/submit?id=${id}`)
}

/** 取消用车申请 */
export function cancelVehicleApply(id: number) {
  return http.put<boolean>(`/oa/vehicle-apply/cancel?id=${id}`)
}
