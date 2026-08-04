import type { EmployeeContact } from '@/api/hrm/employee/contact'
import { http } from '@/http/http'

/** 获得当前员工的联系人列表 */
export function getPortalEmployeeContactList() {
  return http.get<EmployeeContact[]>('/hrm/portal/employee/contact/list')
}
