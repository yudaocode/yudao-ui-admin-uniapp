import { http } from '@/http/http'

/** FMS 科目 */
export interface Subject {
  id?: number
  accountSetId: number // 账套编号
  code: string // 科目编码
  name: string // 科目名称
  parentId: number // 上级科目编号，0 为根科目
  type: number // 科目类型
  category: number // 科目类别
  balanceDirection: number // 余额方向
  auxiliaryTypeIds: number[] // 辅助核算类别编号数组
  auxiliaryTypeNames?: string[] // 辅助核算类别名称数组
  currencyIds: number[] // 外币核算币别编号数组
  quantityAccounting: boolean // 是否启用数量核算
  quantityUnit?: string // 数量单位
  cash: boolean // 是否现金及现金等价物
  migrateParentData?: boolean // 是否迁移上级科目历史数据
  status?: number // 状态
  level?: number // 层级
  children?: Subject[] // 子级科目数组，由前端按需生成
  createTime?: number // 创建时间
}

/** FMS 科目使用情况 */
export interface SubjectUsage {
  childCount: number // 下级科目数量
  voucherEntryCount: number // 凭证分录数量
  initialBalanceCount: number // 初始余额数量
  auxiliaryCombinationCount: number // 辅助核算组合数量
  quantityDataCount: number // 包含数量数据的记录数量
  used: boolean // 是否已被业务使用
}

/** 查询科目列表 */
export function getSubjectList(accountSetId: number, type?: number) {
  return http.get<Subject[]>('/fms/config/subject/list', { accountSetId, type })
}

/** 查询科目精简列表 */
export function getSubjectSimpleList(accountSetId: number, type?: number) {
  return http.get<Subject[]>('/fms/config/subject/simple-list', { accountSetId, type })
}

/** 查询科目详情 */
export function getSubject(accountSetId: number, id: number) {
  return http.get<Subject>('/fms/config/subject/get', { accountSetId, id })
}

/** 查询科目使用情况 */
export function getSubjectUsage(accountSetId: number, id: number) {
  return http.get<SubjectUsage>('/fms/config/subject/get-usage', { accountSetId, id })
}

/** 新增科目 */
export function createSubject(data: Subject) {
  return http.post<number>('/fms/config/subject/create', data)
}

/** 修改科目 */
export function updateSubject(data: Subject) {
  return http.put<boolean>('/fms/config/subject/update', data)
}

/** 修改科目状态 */
export function updateSubjectStatus(accountSetId: number, ids: number[], status: number) {
  return http.put<boolean>('/fms/config/subject/update-status', { accountSetId, ids, status })
}

/** 删除科目（后端为批量删除接口，单个删除传入单个编号） */
export function deleteSubjectList(accountSetId: number, ids: number[]) {
  return http.delete<boolean>('/fms/config/subject/delete-list', { accountSetId, ids })
}
