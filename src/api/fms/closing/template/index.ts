import { http } from '@/http/http'

/** FMS 结账模板科目规则 */
export interface ClosingTemplateSubjectRule {
  subjectId: number // 科目编号
  subjectCode: string // 科目编码
  digest: string // 摘要
  direction: number // 借贷方向
  amountRatio: number // 金额比例
}

/** FMS 结账模板 */
export interface ClosingTemplate {
  id: number // 模板编号
  accountSetId: number // 账套编号
  presetCode?: string // 系统预置编码
  name: string // 模板名称
  category: number // 模板分类
  periodEnd: boolean // 是否期末结转
  subjectId?: number // 来源科目编号
  formulaRule?: number // 取数规则
  timeType?: number // 取数时间类型
  subjects: ClosingTemplateSubjectRule[] // 结转科目规则数组
  sort: number // 显示顺序
  createTime?: number // 创建时间
}

/** 查询结账模板列表 */
export function getClosingTemplateList(accountSetId: number) {
  return http.get<ClosingTemplate[]>('/fms/closing/template/list', { accountSetId })
}
