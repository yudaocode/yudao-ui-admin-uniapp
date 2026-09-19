import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 车辆信息 */
export interface Vehicle {
  id: number // 车辆编号
  no: string // 车牌号
  name?: string // 车辆名称
  deptId?: number // 所属部门编号
  deptName?: string // 所属部门名称
  type?: string // 车型
  category?: string // 车辆分类，字典 oa_vehicle_category
  brandModel?: string // 品牌型号
  seatCount?: number // 座位数
  barePrice?: number // 裸车价格（元）
  compulsoryInsuranceExpireTime?: number | string // 交强险到期时间
  commercialInsuranceExpireTime?: number | string // 商业险到期时间
  inspectionExpireTime?: number | string // 年检到期时间
  picUrl?: string // 车辆图片
  status?: number // 车辆状态，字典 oa_vehicle_status
  sort?: number // 显示顺序
  remark?: string // 备注
  createTime?: number // 创建时间
}

/** 创建车辆 */
export function createVehicle(data: Partial<Vehicle>) {
  return http.post<number>('/oa/vehicle/create', data)
}

/** 更新车辆 */
export function updateVehicle(data: Partial<Vehicle>) {
  return http.put<boolean>('/oa/vehicle/update', data)
}

/** 删除车辆 */
export function deleteVehicle(id: number) {
  return http.delete<boolean>(`/oa/vehicle/delete?id=${id}`)
}

/** 获得车辆 */
export function getVehicle(id: number) {
  return http.get<Vehicle>('/oa/vehicle/get', { id })
}

/** 获得车辆分页 */
export function getVehiclePage(params: Record<string, any>) {
  return http.get<PageResult<Vehicle>>('/oa/vehicle/page', params)
}
