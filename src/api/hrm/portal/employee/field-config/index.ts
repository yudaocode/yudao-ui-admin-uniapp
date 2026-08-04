import type { EmployeeFieldConfig } from '@/api/hrm/employee/config'
import { http } from '@/http/http'

/** 获得当前员工的档案字段配置 */
export function getPortalEmployeeFieldConfigList() {
  return http.get<EmployeeFieldConfig[]>('/hrm/portal/employee/field-config/list')
}
