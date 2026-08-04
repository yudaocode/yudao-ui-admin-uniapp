import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 招聘渠道 */
export interface RecruitChannel {
  id?: number
  systemFlag?: boolean // 是否系统内置
  status?: number // 状态
  name: string // 渠道名称
  sort: number // 显示顺序
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** 招聘渠道状态修改 */
export interface RecruitChannelStatusReq {
  id: number // 招聘渠道编号
  status: number // 状态
}

/** 招聘渠道删除 */
export interface RecruitChannelDeleteReq {
  id: number // 待删除招聘渠道编号
  transferChannelId: number // 承接招聘渠道编号
}

/** 查询招聘渠道分页 */
export function getRecruitChannelPage(params: PageParam) {
  return http.get<PageResult<RecruitChannel>>('/hrm/recruit/channel/page', params)
}

/** 查询招聘渠道详情 */
export function getRecruitChannel(id: number) {
  return http.get<RecruitChannel>(`/hrm/recruit/channel/get?id=${id}`)
}

/** 查询招聘渠道精简列表 */
export function getRecruitChannelSimpleList() {
  return http.get<RecruitChannel[]>('/hrm/recruit/channel/simple-list')
}

/** 新增招聘渠道 */
export function createRecruitChannel(data: RecruitChannel) {
  return http.post<number>('/hrm/recruit/channel/create', data)
}

/** 修改招聘渠道 */
export function updateRecruitChannel(data: RecruitChannel) {
  return http.put<boolean>('/hrm/recruit/channel/update', data)
}

/** 修改招聘渠道状态 */
export function updateRecruitChannelStatus(data: RecruitChannelStatusReq) {
  return http.put<boolean>('/hrm/recruit/channel/update-status', data)
}

/** 删除招聘渠道 */
export function deleteRecruitChannel(data: RecruitChannelDeleteReq) {
  return http.delete<boolean>('/hrm/recruit/channel/delete', data)
}
