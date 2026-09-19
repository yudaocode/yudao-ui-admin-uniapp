import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 还车申请 */
export interface VehicleReturn {
  id: number // 申请编号
  no?: string // 申请单号
  applyId?: number // 用车申请编号
  applyNo?: string // 用车申请单号
  vehicleId?: number // 车辆编号
  vehicleNo?: string // 车牌号
  userId?: number // 申请人编号
  userName?: string // 申请人姓名
  deptId?: number // 申请部门编号
  deptName?: string // 申请部门名称
  actualStartTime?: number | string // 实际出车时间
  startLocation?: string // 实际出车地点
  reason?: string // 用车事由
  passenger?: string // 随行人
  actualReturnTime?: number | string // 实际回车时间
  returnLocation?: string // 回车地点
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  processInstanceId?: string // 流程实例编号
  remark?: string // 备注
  fileUrls?: string[] // 附件地址列表
  createTime?: number // 创建时间
}

/** 获得本人还车申请分页 */
export function getVehicleReturnPage(params: Record<string, any>) {
  return http.get<PageResult<VehicleReturn>>('/oa/vehicle-return/page', params)
}

/** 获得还车申请详情 */
export function getVehicleReturn(id: number) {
  return http.get<VehicleReturn>('/oa/vehicle-return/get', { id })
}

/** 创建还车申请草稿 */
export function createVehicleReturn(data: Partial<VehicleReturn>) {
  return http.post<number>('/oa/vehicle-return/create', data)
}

/** 更新还车申请草稿 */
export function updateVehicleReturn(data: Partial<VehicleReturn>) {
  return http.put<boolean>('/oa/vehicle-return/update', data)
}

/** 删除还车申请草稿 */
export function deleteVehicleReturn(id: number) {
  return http.delete<boolean>(`/oa/vehicle-return/delete?id=${id}`)
}

/** 提交还车申请 */
export function submitVehicleReturn(id: number) {
  return http.put<boolean>(`/oa/vehicle-return/submit?id=${id}`)
}

/** 取消还车申请 */
export function cancelVehicleReturn(id: number) {
  return http.put<boolean>(`/oa/vehicle-return/cancel?id=${id}`)
}
