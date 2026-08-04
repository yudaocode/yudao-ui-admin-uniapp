import { http } from '@/http/http'

/** 员工字段配置 */
export interface EmployeeFieldConfig {
  name: string // 字段名称
  title: string // 字段标题
  groupName: string // 字段分组名称
  visible: boolean // 是否显示
  editable?: boolean // 是否允许员工编辑
  visibleLocked: boolean // 是否锁定显示
  editableLocked: boolean // 是否锁定编辑
}

/** 员工字段显示配置 */
export interface EmployeeFieldVisible {
  name: string // 字段名称
  visible: boolean // 是否显示
}

/** 员工档案字段保存项 */
export interface EmployeeArchiveFieldSave {
  name: string // 字段名称
  visible: boolean // 是否显示
  editable?: boolean // 是否允许员工编辑
}

/** 查询新建员工字段配置 */
export function getEmployeeCreateFieldConfigList(entryStatus: number) {
  return http.get<EmployeeFieldConfig[]>('/hrm/employee/config/create-field/list', { entryStatus })
}

/** 保存新建员工字段配置 */
export function saveEmployeeCreateFieldConfig(entryStatus: number, fields: EmployeeFieldVisible[]) {
  return http.put<boolean>('/hrm/employee/config/create-field/save', {
    entryStatus,
    fields: fields.map(({ name, visible }) => ({ name, visible })),
  })
}

/** 查询员工档案字段配置 */
export function getEmployeeArchiveFieldConfigList() {
  return http.get<EmployeeFieldConfig[]>('/hrm/employee/config/archive-field/list')
}

/** 保存员工档案字段配置 */
export function saveEmployeeArchiveFieldConfig(fields: EmployeeArchiveFieldSave[]) {
  return http.put<boolean>('/hrm/employee/config/archive-field/save', {
    fields: fields.map(({ name, visible, editable }) => ({
      name,
      visible,
      editable,
    })),
  })
}
