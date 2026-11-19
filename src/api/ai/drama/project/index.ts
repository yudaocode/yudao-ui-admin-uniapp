import type { DramaAudio, DramaCharacter, DramaLocation, DramaMotionReference, DramaVisualAsset } from '@/api/ai/drama/asset'
import type { DramaScript } from '@/api/ai/drama/script'
import type { DramaStoryboard } from '@/api/ai/drama/storyboard'
import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 短剧项目 */
export interface DramaProject {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称
  name: string // 项目名称
  description?: string // 项目简介
  idea?: string // 故事想法
  style?: number // 画风，参见 AiDramaStyleEnum
  aestheticSkillId?: number // 美学技能编号
  directorSkillId?: number // 导演技能编号
  storyboardSkillIds?: number[] // 分镜技能编号，按顺序生效
  status: number // 项目状态，参见 AiDramaProjectStatusEnum
  publicStatus: boolean // 是否公开
  composeAspectRatio?: string // 画幅：生成镜头视频、成片使用
  composeTransitionType?: number // 转场类型：0 无、1 溶解、2 黑场淡入淡出、3 滑动
  composeTransitionDurationSeconds?: number // 转场时长（秒）
  composeStatus?: number // 成片状态，参见 AiDramaStatusEnum；为空表示未合成
  composeProgress?: number // 合成进度（0-100）
  composeFileUrl?: string // 成片地址
  composeDuration?: number // 成片时长（秒）
  composeStoryboardCount?: number // 成片镜头数：成片实际拼接的
  composeErrorMessage?: string // 合成失败原因
  composeFinishTime?: string // 成片完成时间
  composeStale?: boolean // 成片是否待重新合成：只在项目详情返回
  composeStaleReason?: string // 待重新合成的原因
  storyboardCount?: number // 镜头数
  storyboardSuccessCount?: number // 视频已完成的镜头数
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
}

/** AI 短剧项目创建 / 修改请求 */
export interface DramaProjectSaveReq {
  id?: number // 编号：修改时必填
  name: string // 项目名称
  description?: string // 项目简介
  idea?: string // 故事想法
  style?: number // 画风，参见 AiDramaStyleEnum
  aestheticSkillId?: number // 美学技能编号
  directorSkillId?: number // 导演技能编号
  storyboardSkillIds?: number[] // 分镜技能编号
  composeAspectRatio?: string // 画幅：9:16、16:9、4:3、3:4、1:1、21:9
}

/** AI 短剧公开项目：公开广场的列表与详情 */
export interface DramaPublic {
  id: number // 编号
  name: string // 项目名称
  style?: number // 画风，参见 AiDramaStyleEnum
  aspectRatio?: string // 画幅：成片实际使用的
  composeFileUrl: string // 成片地址
  composeDuration?: number // 成片时长（秒）
  storyboardCount?: number // 镜头数：成片实际拼接的
  userId: number // 用户编号
  userNickname?: string // 用户昵称
  owner: boolean // 是否本人的项目
  updateTime?: string // 更新时间
  outline?: string // 剧情大纲，仅详情返回
  characters?: { name: string, imageUrl?: string }[] // 角色，仅详情返回
}

/** AI 短剧合成成片请求 */
export interface DramaComposeReq {
  projectId: number // 项目编号
  storyboardIds: number[] // 镜头编号，按播放顺序
  aspectRatio: string // 画幅
  transitionType: number // 转场类型：0 无、1 溶解、2 黑场淡入淡出、3 滑动
  transitionDuration?: number // 转场时长（秒），0.1-2
  narrationAudioId?: number // 旁白音频编号
  watermarkText?: string // 水印文字
}

/** AI 短剧项目公开状态修改请求（管理端） */
export interface DramaProjectUpdatePublicReq {
  id: number // 编号
  publicStatus: boolean // 是否公开
}

/** AI 短剧项目详情：工作台、管理端只读查看 */
export interface DramaProjectDetail {
  project: DramaProject // 项目
  script?: DramaScript // 当前剧本
  characters: DramaCharacter[] // 角色
  locations: DramaLocation[] // 场景
  visualAssets: DramaVisualAsset[] // 道具、关键帧，以及它们的历史版本
  audios: DramaAudio[] // 不属于角色的音频：旁白、配乐、参考音频等
  motionReferences: DramaMotionReference[] // 动作参考视频
  storyboards: DramaStoryboard[] // 当前剧本的镜头
}

// ========== 我的项目 ==========

/** 创建项目 */
export function createDramaProject(data: DramaProjectSaveReq) {
  return http.post<number>('/ai/drama/project/create', data)
}

/** 修改我的项目 */
export function updateDramaProjectMy(data: DramaProjectSaveReq) {
  return http.put<boolean>('/ai/drama/project/update-my', data)
}

/** 删除我的项目 */
export function deleteDramaProjectMy(id: number) {
  return http.delete<boolean>(`/ai/drama/project/delete-my?id=${id}`)
}

/** 获得我的项目分页 */
export function getDramaProjectMyPage(params: PageParam) {
  return http.get<PageResult<DramaProject>>('/ai/drama/project/my-page', params)
}

/** 获得我的项目详情 */
export function getDramaProjectDetailMy(id: number) {
  return http.get<DramaProjectDetail>(`/ai/drama/project/get-detail-my?id=${id}`)
}

/** 合成成片 */
export function composeDramaProject(data: DramaComposeReq) {
  return http.post<boolean>('/ai/drama/project/compose', data)
}

// ========== 公开广场 ==========

/** 获得公开项目分页 */
export function getDramaProjectPublicPage(params: PageParam) {
  return http.get<PageResult<DramaPublic>>('/ai/drama/project/public-page', params)
}

/** 获得公开项目详情 */
export function getDramaProjectPublicDetail(id: number) {
  return http.get<DramaPublic>(`/ai/drama/project/public-detail?id=${id}`)
}

// ========== 项目管理 ==========

/** 获得项目分页 */
export function getDramaProjectPage(params: PageParam) {
  return http.get<PageResult<DramaProject>>('/ai/drama/project/page', params)
}

/** 获得项目详情 */
export function getDramaProjectDetail(id: number) {
  return http.get<DramaProjectDetail>(`/ai/drama/project/get-detail?id=${id}`)
}

/** 修改项目是否公开：只有成片已完成的项目可以公开 */
export function updateDramaProjectPublic(data: DramaProjectUpdatePublicReq) {
  return http.put<boolean>('/ai/drama/project/update-public', data)
}

/** 删除项目 */
export function deleteDramaProject(id: number) {
  return http.delete<boolean>(`/ai/drama/project/delete?id=${id}`)
}
