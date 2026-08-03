import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 招聘职位（候选人选择器所需精简字段） */
export interface RecruitPost {
  id?: number // 招聘职位编号
  postName: string // 职位名称
  deptId?: number // 用人部门编号
  deptName?: string // 用人部门名称
  status?: number // 职位状态
  ownerEmployeeId?: number // 招聘负责人员工编号
  ownerEmployeeName?: string // 招聘负责人姓名
}

/** 查询招聘职位详情 */
export function getRecruitPost(id: number) {
  return http.get<RecruitPost>(`/hrm/recruit/post/get?id=${id}`)
}

/** 获得招聘职位精简列表 */
export function getRecruitPostSimpleList() {
  return http.get<RecruitPost[]>('/hrm/recruit/post/simple-list')
}

/** 查询招聘职位分页（候选人搜索备用） */
export function getRecruitPostPage(params: PageParam) {
  return http.get<PageResult<RecruitPost>>('/hrm/recruit/post/page', params)
}
