import { http } from '@/http/http'

/** 招聘面试 */
export interface RecruitInterview {
  id?: number // 面试编号
  candidateId?: number // 候选人编号
  type?: number // 面试方式
  stageNumber?: number // 面试轮次
  interviewEmployeeId?: number // 主面试官员工编号
  interviewEmployeeName?: string // 主面试官姓名
  otherInterviewEmployeeIds?: number[] // 其他面试官员工编号数组
  otherInterviewEmployeeNames?: string[] // 其他面试官姓名数组
  interviewTime?: Date | string | number // 面试时间
  address?: string // 面试地址
  remark?: string // 备注
  result?: number // 面试结果
  evaluate?: string // 面试评价
  cancelReason?: string // 取消原因
  createTime?: Date | string // 创建时间
}

/** 招聘面试结果修改 */
export interface RecruitInterviewResultReq {
  id: number // 面试编号
  result: number // 面试结果
  evaluate?: string // 面试评价
  cancelReason?: string // 取消原因
}

/** 查询招聘面试详情 */
export function getRecruitInterview(id: number) {
  return http.get<RecruitInterview>(`/hrm/recruit/interview/get?id=${id}`)
}

/** 查询候选人的招聘面试列表 */
export function getRecruitInterviewListByCandidate(candidateId: number) {
  return http.get<RecruitInterview[]>(
    `/hrm/recruit/interview/list-by-candidate?candidateId=${candidateId}`,
  )
}

/** 新增招聘面试 */
export function createRecruitInterview(data: RecruitInterview) {
  return http.post<number>('/hrm/recruit/interview/create', data)
}

/** 修改招聘面试 */
export function updateRecruitInterview(data: RecruitInterview) {
  return http.put<boolean>('/hrm/recruit/interview/update', data)
}

/** 修改招聘面试结果 */
export function updateRecruitInterviewResult(data: RecruitInterviewResultReq) {
  return http.put<boolean>('/hrm/recruit/interview/update-result', data)
}

/** 删除招聘面试 */
export function deleteRecruitInterview(id: number) {
  return http.delete<boolean>(`/hrm/recruit/interview/delete?id=${id}`)
}
