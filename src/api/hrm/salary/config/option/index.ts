import { http } from '@/http/http'

/** 工资表薪资项 */
export interface SalaryOption {
  id: number // 薪资项编号
  code: number // 薪资项编码
  parentCode: number // 父薪资项编码
  name: string // 薪资项名称
  remark?: string // 备注
  systemFlag: boolean // 是否系统默认项
  type: number // 薪资项类型
  taxEnabled: boolean // 是否计税
  visible: boolean // 是否显示
  calculateEnabled: boolean // 是否参与计算
  enabled: boolean // 是否启用
  templateId?: number // 标准薪资项目录编号
  children?: SalaryOption[] // 子薪资项
  createTime?: Date | string | number // 创建时间
}

/** 工资表薪资项新增 */
export interface SalaryOptionReq {
  parentCode?: number // 父薪资项编码
  name: string // 薪资项名称
  remark?: string // 备注
}

/** 薪资项值 */
export interface SalaryOptionValue {
  code?: number // 薪资项编码
  name?: string // 薪资项名称
  value?: number // 薪资项金额
}

/** 新增工资表薪资项 */
export function createSalaryOption(data: SalaryOptionReq) {
  return http.post<number>('/hrm/salary/option/create', data)
}

/** 更新工资表薪资项启用状态 */
export function updateSalaryOptionEnabled(id: number, enabled: boolean) {
  return http.put<boolean>('/hrm/salary/option/update-enabled', { id, enabled })
}

/** 更新工资表薪资项显示状态 */
export function updateSalaryOptionVisible(id: number, visible: boolean) {
  return http.put<boolean>('/hrm/salary/option/update-visible', { id, visible })
}

/** 删除工资表薪资项 */
export function deleteSalaryOption(id: number) {
  return http.delete<boolean>(`/hrm/salary/option/delete?id=${id}`)
}

/** 同步标准工资表薪资项 */
export function syncSalaryOption() {
  return http.put<boolean>('/hrm/salary/option/sync')
}

/** 查询工资表薪资项列表 */
export function getSalaryOptionList() {
  return http.get<SalaryOption[]>('/hrm/salary/option/list')
}

/** 查询工资表薪资项精简列表 */
export function getSalaryOptionSimpleList(adjustable?: boolean) {
  return http.get<SalaryOption[]>('/hrm/salary/option/simple-list', { adjustable })
}
