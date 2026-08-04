import type { EmployeeQuitInfo } from '@/api/hrm/employee/quit-info'
import { http } from '@/http/http'

/** 获得当前员工的离职信息 */
export function getPortalEmployeeQuitInfo() {
  return http.get<EmployeeQuitInfo>('/hrm/portal/employee/quit-info/get')
}
