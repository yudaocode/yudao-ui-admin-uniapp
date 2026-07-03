import { http } from '@/http/http'

/** MES 点检保养方案项目 */
export interface DvCheckPlanSubject {
  id?: number
  planId: number // 方案编号
  subjectId: number // 项目编号
  subjectCode?: string // 项目编码
  subjectName?: string // 项目名称
  subjectType?: number // 项目类型
  subjectContent?: string // 项目内容
  subjectStandard?: string // 标准
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询指定方案的项目列表 */
export function getListByPlan(planId: number) {
  return http.get<DvCheckPlanSubject[]>(`/mes/dv/check-plan-subject/list-by-plan?planId=${planId}`)
}

/** 新增方案项目关联 */
export function create(data: DvCheckPlanSubject) {
  return http.post<number>('/mes/dv/check-plan-subject/create', data)
}

/** 删除方案项目关联 */
export function deleteCheckPlanSubject(id: number) {
  return http.delete<boolean>(`/mes/dv/check-plan-subject/delete?id=${id}`)
}
