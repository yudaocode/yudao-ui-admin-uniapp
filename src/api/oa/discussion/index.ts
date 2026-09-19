import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OA 投票选项 */
export interface VoteOption {
  id?: number // 选项编号
  title: string // 选项标题
  color?: string // 选项颜色
  sort: number // 显示顺序
  voteCount?: number // 投票数
  voted?: boolean // 当前用户是否已选择
  voterUserNames?: string[] // 投票人用户昵称列表
}

/** OA 讨论 */
export interface Discussion {
  id?: number // 讨论编号
  userId?: number // 发布人用户编号
  userName?: string // 发布人用户昵称
  type: number // 讨论类型
  title: string // 标题
  content?: string // 内容
  fileUrls: string[] // 附件地址列表
  visitCount?: number // 访问次数
  replyCount?: number // 回复数
  likeCount?: number // 点赞数
  liked?: boolean // 当前用户是否已点赞
  likeUserNames?: string[] // 点赞人用户昵称列表
  voteMultiple?: boolean // 投票是否允许多选
  voteStartTime?: string | number // 投票开始时间
  voteEndTime?: string | number // 投票结束时间
  voteOptions?: VoteOption[] // 投票选项列表
  createTime?: string // 创建时间
}

/** OA 讨论回复 */
export interface DiscussionReply {
  id?: number // 回复编号
  discussionId: number // 讨论编号
  userId?: number // 回复人用户编号
  userName?: string // 回复人用户昵称
  parentId?: number // 父回复编号
  replyUserId?: number // 被回复人用户编号
  replyUserName?: string // 被回复人用户昵称
  content: string // 回复内容
  likeCount?: number // 点赞数
  liked?: boolean // 当前用户是否已点赞
  likeUserNames?: string[] // 点赞人用户昵称列表
  createTime?: string // 创建时间
  children?: DiscussionReply[] // 楼层内的子回复
}

/** 查询讨论分页 */
export function getDiscussionPage(params: PageParam) {
  return http.get<PageResult<Discussion>>('/oa/discussion/page', params)
}

/** 查询管理范围内的讨论分页 */
export function getDiscussionManagePage(params: PageParam) {
  return http.get<PageResult<Discussion>>('/oa/discussion/manage-page', params)
}

/** 查询讨论详情，visit 为 true 时记录本次访问 */
export function getDiscussion(id: number, visit = false) {
  return http.get<Discussion>(`/oa/discussion/get?id=${id}&visit=${visit}`)
}

/** 创建讨论 */
export function createDiscussion(data: Discussion) {
  return http.post<number>('/oa/discussion/create', data)
}

/** 更新讨论 */
export function updateDiscussion(data: Discussion) {
  return http.put<boolean>('/oa/discussion/update', data)
}

/** 删除讨论 */
export function deleteDiscussion(id: number) {
  return http.delete<boolean>(`/oa/discussion/delete?id=${id}`)
}

/** 查询讨论回复分页，sortOrder 控制楼层时间排序 */
export function getDiscussionReplyPage(params: PageParam & { discussionId: number, userId?: number }, sortOrder: 'asc' | 'desc' = 'asc') {
  return http.get<PageResult<DiscussionReply>>('/oa/discussion-reply/page', {
    ...params,
    // SortablePageParam 的列表参数按 Spring 下标风格传递
    'sortingFields[0].field': 'createTime',
    'sortingFields[0].order': sortOrder,
  })
}

/** 创建讨论回复，parentId 为 0 表示主回复 */
export function createDiscussionReply(data: { discussionId: number, parentId?: number, content: string }) {
  return http.post<number>('/oa/discussion-reply/create', data)
}

/** 删除讨论回复 */
export function deleteDiscussionReply(id: number) {
  return http.delete<boolean>(`/oa/discussion-reply/delete?id=${id}`)
}

/** 参与讨论投票 */
export function voteDiscussion(discussionId: number, optionIds: number[]) {
  return http.post<boolean>('/oa/discussion-vote/create', { discussionId, optionIds })
}

/** 点赞讨论或主回复 */
export function createDiscussionLike(discussionId?: number, replyId?: number) {
  return http.post<boolean>('/oa/discussion-like/create', { discussionId, replyId })
}

/** 取消讨论或主回复点赞 */
export function deleteDiscussionLike(discussionId?: number, replyId?: number) {
  return http.delete<boolean>('/oa/discussion-like/delete', undefined, { discussionId, replyId })
}
