import { http } from '@/http/http'

/** MES 设备类型 */
export interface DvMachineryType {
  id?: number
  parentId: number
  code: string
  name: string
  sort: number
  status: number
  remark: string | null
  createTime?: Date
  children?: DvMachineryType[]
  parentName?: string
}

/** 查询设备类型列表 */
export function getMachineryTypeList(params?: Record<string, any>) {
  return http.get<DvMachineryType[]>(`/mes/dv/machinery-type/list`, params)
}

/** 查询设备类型精简列表 */
export function getMachineryTypeSimpleList() {
  return http.get<DvMachineryType[]>(`/mes/dv/machinery-type/simple-list`)
}

/** 查询设备类型详情 */
export function getMachineryType(id: number) {
  return http.get<DvMachineryType>(`/mes/dv/machinery-type/get?id=${id}`)
}

/** 新增设备类型 */
export function createMachineryType(data: DvMachineryType) {
  return http.post<number>(`/mes/dv/machinery-type/create`, data)
}

/** 修改设备类型 */
export function updateMachineryType(data: DvMachineryType) {
  return http.put<boolean>(`/mes/dv/machinery-type/update`, data)
}

/** 删除设备类型 */
export function deleteMachineryType(id: number) {
  return http.delete<boolean>(`/mes/dv/machinery-type/delete?id=${id}`)
}
