import { http } from '@/http/http'

/** 员工材料附件 */
export interface EmployeeFile {
  id?: number // 附件编号
  employeeId: number // 员工编号
  type: number // 附件类型
  url: string // 附件地址
  createTime?: Date | string | number // 创建时间
}

/** 查询员工材料附件列表 */
export function getEmployeeFileList(employeeId: number) {
  return http.get<EmployeeFile[]>('/hrm/employee/file/list', { employeeId })
}

/** 保存员工材料附件 */
export function saveEmployeeFiles(data: {
  employeeId: number
  type: number
  fileUrls: string[]
}) {
  return http.put<boolean>('/hrm/employee/file/save', data)
}
