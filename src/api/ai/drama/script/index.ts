import type { DramaStoryboard, DramaStoryboardSaveReq } from '@/api/ai/drama/storyboard'
import { http } from '@/http/http'
import { sendSsePost } from '@/http/sse'

/** AI 短剧剧本 */
export interface DramaScript {
  id: number // 编号
  projectId: number // 项目编号
  title?: string // 标题
  tone?: string // 叙事基调
  outline?: string // 剧情大纲
  content?: string // 剧本正文
  source?: number // 来源
  creationMode?: number // 创作模式
  sourceMaterial?: string // 原始素材
  worldbuilding?: string // 世界观设定
  revisionNote?: string // 本版本的修改说明
  createTime?: string // 创建时间
}

/** AI 短剧剧本保存请求：指定编号时更新该版本，未指定时新增版本 */
export interface DramaScriptUpdateReq {
  id?: number // 编号
  projectId: number // 项目编号
  title?: string // 标题
  tone?: string // 叙事基调
  outline?: string // 剧情大纲
  content?: string // 剧本正文
  creationMode?: number // 创作模式
  sourceMaterial?: string // 原始素材
  worldbuilding?: string // 世界观设定
  revisionNote?: string // 本版本的修改说明
}

/** AI 短剧从故事想法创建项目请求：名称为空时使用生成的剧名 */
export interface DramaScriptCreateReq {
  name?: string // 项目名称
  description?: string // 项目简介
  idea: string // 故事想法
  style?: number // 画风，参见 AiDramaStyleEnum
  aestheticSkillId?: number // 美学技能编号
  directorSkillId?: number // 导演技能编号
  storyboardSkillIds?: number[] // 分镜技能编号
  composeAspectRatio?: string // 画幅
  modelId?: number // 模型编号
}

/** AI 短剧从故事想法创建项目的流式响应：生成中返回增量文本 content，最后一条返回项目编号 projectId */
export interface DramaScriptCreateResp {
  content?: string // 增量文本
  projectId?: number // 项目编号
}

/** AI 短剧导入审阅后的分镜请求：替换当前剧本的分镜 */
export interface DramaStoryboardImportReq {
  projectId: number // 项目编号
  scriptId: number // 剧本编号
  storyboards: DramaStoryboardSaveReq[] // 分镜
}

const GENERATE_TIMEOUT = 5 * 60 * 1000 // 同步调用模型生成，超时时间放宽到 5 分钟

/** 保存剧本：返回剧本编号 */
export function updateDramaScript(data: DramaScriptUpdateReq) {
  return http.put<number>('/ai/drama/script/update', data)
}

/** 获得剧本版本列表 */
export function getDramaScriptList(projectId: number) {
  return http.get<DramaScript[]>(`/ai/drama/script/list?projectId=${projectId}`)
}

/** 生成剧本 */
export function generateDramaScript(projectId: number, modelId?: number) {
  return http.post<DramaScript>('/ai/drama/script/generate', { projectId, modelId }, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 打磨剧本 */
export function polishDramaScript(projectId: number, note: string, modelId?: number) {
  return http.post<DramaScript>('/ai/drama/script/polish', { projectId, note, modelId }, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 分析资产清单：角色、场景、道具 */
export function analyzeDramaAssetList(projectId: number, modelId?: number) {
  return http.post<boolean>('/ai/drama/script/analyze-asset-list', { projectId, modelId }, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 拆分分镜 */
export function generateDramaStoryboardList(projectId: number, modelId?: number) {
  return http.post<boolean>('/ai/drama/script/generate-storyboard-list', { projectId, modelId }, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 规划分镜：只返回不保存，审阅后导入 */
export function planDramaStoryboardList(projectId: number, modelId?: number) {
  return http.post<DramaStoryboard[]>('/ai/drama/script/plan-storyboard-list', { projectId, modelId }, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 导入审阅后的分镜 */
export function importDramaStoryboardList(data: DramaStoryboardImportReq) {
  return http.post<boolean>('/ai/drama/script/import-storyboard-list', data)
}

/** 生成摄影规则 */
export function generateDramaPhotographyRules(projectId: number, modelId?: number) {
  return http.post<boolean>('/ai/drama/script/generate-photography-rules', { projectId, modelId }, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 生成表演指导 */
export function generateDramaActingNotes(projectId: number, modelId?: number) {
  return http.post<boolean>('/ai/drama/script/generate-acting-notes', { projectId, modelId }, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 规划关键帧：生成关键帧画面描述与画面焦点 */
export function planDramaFrameList(projectId: number, modelId?: number) {
  return http.post<boolean>('/ai/drama/script/plan-frame-list', { projectId, modelId }, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 从故事想法创建项目：流式生成初版剧本 */
export function createDramaProjectStream(
  data: DramaScriptCreateReq,
  ctrl: AbortController,
  onMessage?: (res: { data: string }) => void | Promise<void>,
  onError?: (...args: any[]) => void,
  onClose?: (...args: any[]) => void,
) {
  return sendSsePost('/ai/drama/script/create-stream', {
    data,
    ctrl,
    onMessage,
    onError,
    onClose,
  })
}
