import { http } from '@/http/http'

/** 工资条模板薪资项 */
export interface SalarySlipTemplateOption {
  name?: string // 工资项名称
  type?: number // 工资项类型
  code?: number // 工资项编码
  remark?: string // 备注
  parentCode?: number // 父工资项编码
  hidden?: boolean // 是否隐藏
  sort?: number // 排序
}

/** 工资条模板 */
export interface SalarySlipTemplate {
  id?: number // 工资条模板编号
  name: string // 模板名称
  hideEmpty?: boolean // 是否隐藏空工资项
  defaultStatus?: boolean // 是否默认模板
  options?: SalarySlipTemplateOption[] // 模板工资项
  createTime?: string // 创建时间
}

/** 获得工资条模板列表 */
export function getSalarySlipTemplateList() {
  return http.get<SalarySlipTemplate[]>('/hrm/salary/slip-template/list')
}

/** 获得工资条模板详情 */
export function getSalarySlipTemplate(id: number) {
  return http.get<SalarySlipTemplate>(`/hrm/salary/slip-template/get?id=${id}`)
}
