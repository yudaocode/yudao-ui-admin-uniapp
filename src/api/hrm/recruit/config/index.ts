import { http } from '@/http/http'

/** 查询招聘淘汰原因列表 */
export function getRecruitEliminateReasonList() {
  return http.get<string[]>('/hrm/recruit/config/eliminate-reason/list')
}
