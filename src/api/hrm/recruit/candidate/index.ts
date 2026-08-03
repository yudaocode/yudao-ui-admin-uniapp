import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 招聘候选人 */
export interface RecruitCandidate {
  id?: number // 候选人编号
  name: string // 候选人姓名
  mobile: string // 手机号码
  sex?: number // 性别
  age?: number // 年龄
  email?: string // 邮箱
  postId?: number // 应聘职位编号
  postName?: string // 应聘职位名称
  postStatus?: number // 应聘职位状态
  deptId?: number // 用人部门编号
  deptName?: string // 用人部门名称
  ownerEmployeeId?: number // 招聘负责人员工编号
  ownerEmployeeName?: string // 招聘负责人姓名
  stageNumber?: number // 面试轮次
  workTime?: number // 工作年限
  education?: number // 学历
  graduateSchool?: string // 毕业院校
  latestWorkPlace?: string // 最近工作单位
  channelId?: number // 招聘渠道编号
  channelName?: string // 招聘渠道名称
  remark?: string // 备注
  status?: number // 候选人状态
  eliminate?: string // 淘汰原因
  statusUpdateTime?: Date | string // 状态更新时间
  entryTime?: number | Date | string // 入职时间
  resumeUrls: string[] // 简历附件地址数组
  interviewId?: number // 当前面试编号
  interviewType?: number // 面试方式
  interviewEmployeeId?: number // 主面试官员工编号
  interviewEmployeeName?: string // 主面试官姓名
  otherInterviewEmployeeIds?: number[] // 其他面试官员工编号数组
  otherInterviewEmployeeNames?: string[] // 其他面试官姓名数组
  interviewTime?: Date | string | number // 面试时间
  interviewAddress?: string // 面试地址
  interviewResult?: number // 面试结果
  employeeId?: number // 转入的员工编号
  creator?: string // 创建人用户编号
  creatorName?: string // 创建人名称
  createTime?: Date | string // 创建时间
  updateTime?: Date | string // 更新时间
}

/** 招聘候选人状态统计 */
export interface RecruitCandidateStatusCount {
  status: number // 候选人状态
  count: number // 候选人数量
}

/** 招聘候选人状态修改 */
export interface RecruitCandidateUpdateStatusReq {
  id: number // 候选人编号
  status: number // 候选人状态
}

/** 招聘候选人职位修改 */
export interface RecruitCandidateUpdatePostReq {
  id: number // 候选人编号
  postId: number // 应聘职位编号
}

/** 招聘候选人渠道修改 */
export interface RecruitCandidateUpdateChannelReq {
  id: number // 候选人编号
  channelId: number // 招聘渠道编号
}

/** 招聘候选人淘汰 */
export interface RecruitCandidateUpdateEliminateReq {
  id: number // 候选人编号
  eliminate: string // 淘汰原因
  remark?: string // 备注
}

/** 查询招聘候选人分页 */
export function getRecruitCandidatePage(params: PageParam) {
  return http.get<PageResult<RecruitCandidate>>('/hrm/recruit/candidate/page', params)
}

/** 查询招聘候选人详情 */
export function getRecruitCandidate(id: number) {
  return http.get<RecruitCandidate>(`/hrm/recruit/candidate/get?id=${id}`)
}

/** 获得招聘候选人状态统计 */
export function getRecruitCandidateStatusCount(params: Record<string, any>) {
  return http.get<RecruitCandidateStatusCount[]>('/hrm/recruit/candidate/status-count', params)
}

/** 获得待清理的招聘候选人编号 */
export function getCleanRecruitCandidateIdList(statuses: number[], days: number) {
  return http.get<number[]>('/hrm/recruit/candidate/clean-ids', { statuses, days })
}

/** 新增招聘候选人 */
export function createRecruitCandidate(data: RecruitCandidate) {
  return http.post<number>('/hrm/recruit/candidate/create', data)
}

/** 修改招聘候选人 */
export function updateRecruitCandidate(data: RecruitCandidate) {
  return http.put<boolean>('/hrm/recruit/candidate/update', data)
}

/** 修改招聘候选人状态 */
export function updateRecruitCandidateStatus(data: RecruitCandidateUpdateStatusReq) {
  return http.put<boolean>('/hrm/recruit/candidate/update-status', data)
}

/** 修改招聘候选人应聘职位 */
export function updateRecruitCandidatePost(data: RecruitCandidateUpdatePostReq) {
  return http.put<boolean>('/hrm/recruit/candidate/update-post', data)
}

/** 修改招聘候选人招聘渠道 */
export function updateRecruitCandidateChannel(data: RecruitCandidateUpdateChannelReq) {
  return http.put<boolean>('/hrm/recruit/candidate/update-channel', data)
}

/** 淘汰招聘候选人 */
export function eliminateRecruitCandidate(data: RecruitCandidateUpdateEliminateReq) {
  return http.put<boolean>('/hrm/recruit/candidate/eliminate', data)
}

/** 删除招聘候选人 */
export function deleteRecruitCandidate(id: number) {
  return http.delete<boolean>(`/hrm/recruit/candidate/delete?id=${id}`)
}
