import { http } from '@/http/http'

/** 调薪项 */
export interface SalaryChangeOption {
  name: string // 薪资项名称
  code: number // 薪资项编码
}

/** 调薪模板 */
export interface SalaryChangeTemplate {
  id?: number // 调薪模板编号
  name: string // 模板名称
  defaultStatus: boolean // 是否默认模板
  options: SalaryChangeOption[] // 调薪项配置
  createTime?: Date | string | number // 创建时间
}

/** 获得调薪模板列表 */
export function getSalaryChangeTemplateList() {
  return http.get<SalaryChangeTemplate[]>('/hrm/salary/change-template/list')
}

/** 获得调薪模板 */
export function getSalaryChangeTemplate(id: number) {
  return http.get<SalaryChangeTemplate>(`/hrm/salary/change-template/get?id=${id}`)
}

/** 创建调薪模板 */
export function createSalaryChangeTemplate(data: SalaryChangeTemplate) {
  return http.post<number>('/hrm/salary/change-template/create', data)
}

/** 修改调薪模板 */
export function updateSalaryChangeTemplate(data: SalaryChangeTemplate) {
  return http.put<boolean>('/hrm/salary/change-template/update', data)
}

/** 删除调薪模板 */
export function deleteSalaryChangeTemplate(id: number) {
  return http.delete<boolean>(`/hrm/salary/change-template/delete?id=${id}`)
}
