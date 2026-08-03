import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 招聘职位 */
export interface RecruitPost {
  id?: number // 招聘职位编号
  postName: string // 职位名称
  deptId?: number // 用人部门编号
  deptName?: string // 用人部门名称
  jobNature?: number // 工作性质
  areaId?: number // 工作城市地区编号
  areaName?: string // 工作城市地区名称
  recruitNum?: number // 招聘人数
  reason?: string // 招聘原因
  workTime?: number // 工作经验要求
  educationRequire?: number // 学历要求
  minSalary?: number // 最低薪资，-1 表示面议
  maxSalary?: number // 最高薪资，-1 表示面议
  salaryUnit?: number // 薪资单位，-1 表示面议
  minAge?: number // 最小年龄，-1 表示不限
  maxAge?: number // 最大年龄，-1 表示不限
  latestEntryTime?: number | string // 最迟到岗时间
  ownerEmployeeId?: number // 招聘负责人员工编号
  ownerEmployeeName?: string // 招聘负责人姓名
  interviewEmployeeIds?: number[] // 面试官员工编号数组
  interviewEmployeeNames?: string[] // 面试官姓名数组
  description?: string // 职位描述
  emergencyLevel?: number // 紧急程度
  postTypeId?: number // 职位类型编号
  postTypeName?: string // 职位类型名称
  status?: number // 职位状态
  stopReason?: string // 停止原因
  hasEntryNum?: number // 已入职人数
  recruitSchedule?: number // 招聘进度百分比
  createTime?: string // 创建时间
}

/** 招聘职位状态统计 */
export interface RecruitPostStatusCount {
  status: number // 职位状态
  count: number // 职位数量
}

/** 招聘职位状态修改请求 */
export interface RecruitPostStatusReq {
  id: number // 招聘职位编号
  status: number // 职位状态
  stopReason?: string // 停止原因
}

/** 查询招聘职位分页 */
export function getRecruitPostPage(params: PageParam) {
  return http.get<PageResult<RecruitPost>>('/hrm/recruit/post/page', params)
}

/** 查询招聘职位详情 */
export function getRecruitPost(id: number) {
  return http.get<RecruitPost>(`/hrm/recruit/post/get?id=${id}`)
}

/** 获得招聘职位精简列表 */
export function getRecruitPostSimpleList() {
  return http.get<RecruitPost[]>('/hrm/recruit/post/simple-list')
}

/** 获得招聘职位状态统计 */
export function getRecruitPostStatusCount(params: Record<string, any>) {
  return http.get<RecruitPostStatusCount[]>('/hrm/recruit/post/status-count', params)
}

/** 新增招聘职位 */
export function createRecruitPost(data: RecruitPost) {
  return http.post<number>('/hrm/recruit/post/create', data)
}

/** 修改招聘职位 */
export function updateRecruitPost(data: RecruitPost) {
  return http.put<boolean>('/hrm/recruit/post/update', data)
}

/** 修改招聘职位状态 */
export function updateRecruitPostStatus(data: RecruitPostStatusReq) {
  return http.put<boolean>('/hrm/recruit/post/update-status', data)
}
