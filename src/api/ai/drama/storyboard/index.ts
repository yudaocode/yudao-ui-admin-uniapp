import { http } from '@/http/http'

/** AI 短剧台词 */
export interface DramaDialogue {
  characterId?: number // 发言人；旁白为空
  line: string // 台词
}

/** AI 短剧出场角色：引用一个形象，并指定站位 */
export interface DramaCharacterRef {
  appearanceId?: number // 形象编号
  slot?: string // 站位：取自场景的可站位置
}

/** AI 短剧表演指导 */
export interface DramaActingNote {
  name: string // 角色名
  acting: string // 表演指令
}

/** AI 短剧连续性设置：只列出工作台编辑的字段，其它规划字段原样保留 */
export interface DramaContinuity {
  voiceSpeakerIds?: number[] // 参考音频的发言角色；为空时按台词的发言角色
  manualStartFrame?: { url?: string } // 手动起始帧：优先于关键帧
  useFirstFrame?: boolean // 是否使用起始帧生成视频：缺省是
  includeLocation?: boolean // 视频参考图是否包含场景图：缺省是
  referenceVideoUrls?: string[] // 动作参考视频
  materialUrls?: string[] // 素材图片：可直接渲染为镜头视频
  frameFocus?: string // 关键帧画面焦点
  keyframeDirective?: string // 关键帧导演指令
  [key: string]: any
}

/** AI 短剧分镜 */
export interface DramaStoryboard {
  id: number // 编号
  projectId: number // 项目编号
  scriptId?: number // 剧本编号
  sceneNo?: number // 镜头序号
  title?: string // 标题
  sourceText?: string // 剧本原文
  sceneText?: string // 画面描述
  sceneType?: number // 场景类型，参见 ai_drama_scene_type 字典
  shotType?: string // 景别
  cameraMove?: string // 运镜
  duration?: number // 时长（秒）
  photographyRules?: Record<string, any> // 摄影规则
  actingNotes?: DramaActingNote[] // 表演指导
  imagePrompt?: string // 图片提示词：生成关键帧使用
  videoPrompt?: string // 视频提示词
  dialogues?: DramaDialogue[] // 台词
  characters?: DramaCharacterRef[] // 出场角色
  locationId?: number // 引用的场景编号
  visualAssetIds?: number[] // 道具：为空时按道具关联的镜头序号，空数组表示没有道具
  continuity?: DramaContinuity // 连续性设置
  taskId?: string // 服务商任务编号
  videoStatus?: number // 视频状态，参见 AiDramaStatusEnum
  videoUrl?: string // 视频地址
  lastFrameUrl?: string // 镜头视频尾帧
  videoModelId?: number // 视频模型编号
  videoModel?: string // 视频模型标识
  videoResolution?: string // 视频分辨率
  errorMessage?: string // 错误信息
  planWarnings?: string[] // 规划提示：只在规划分镜时返回
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
}

/** AI 短剧分镜创建 / 修改请求 */
export interface DramaStoryboardSaveReq {
  id?: number // 编号：修改时必填
  projectId: number // 项目编号
  scriptId?: number // 剧本编号
  sceneNo?: number // 镜头序号
  title?: string // 标题
  sourceText?: string // 剧本原文
  sceneText?: string // 画面描述
  sceneType?: number // 场景类型
  shotType?: string // 景别
  cameraMove?: string // 运镜
  duration?: number // 时长（秒）
  photographyRules?: Record<string, any> // 摄影规则
  actingNotes?: DramaActingNote[] // 表演指导
  imagePrompt?: string // 图片提示词
  videoPrompt?: string // 视频提示词
  dialogues?: DramaDialogue[] // 台词
  characters?: DramaCharacterRef[] // 出场角色
  locationId?: number // 引用的场景编号
  visualAssetIds?: number[] // 道具
  continuity?: DramaContinuity // 连续性设置
  videoModelId?: number // 视频模型编号
  videoResolution?: string // 视频分辨率
}

/** AI 短剧生成镜头视频请求：requestId 每次点击生成一个，网络重试时沿用；批量生成时 id 为项目编号 */
export interface DramaStoryboardVideoReq {
  id: number // 编号
  modelId: number // 模型编号
  scriptId?: number // 剧本编号
  resolution?: string // 分辨率
  requestId?: string // 请求编号
}

/** AI 短剧生成关键帧请求：有修正说明时，以当前关键帧为参考修正构图 */
export interface DramaStoryboardFrameReq {
  id: number // 编号
  modelId: number // 模型编号
  revisePrompt?: string // 修正说明
}

/** AI 短剧批量生成关键帧请求：镜头序号范围内、还没有关键帧的镜头 */
export interface DramaStoryboardFrameBatchReq {
  projectId: number // 项目编号
  modelId: number // 模型编号
  startSceneNo: number // 起始镜头序号
  endSceneNo: number // 结束镜头序号
}

/** AI 短剧导入外部视频请求 */
export interface DramaStoryboardImportVideoReq {
  id: number // 编号
  fileUrl: string // 视频地址
}

/** AI 短剧设置发言角色请求：为空时按台词自动识别 */
export interface DramaStoryboardSpeakerReq {
  id: number // 编号
  characterIds?: number[] // 发言角色编号
}

/** AI 短剧镜头声音预览：生成镜头视频时使用的发言角色、参考音频 */
export interface DramaStoryboardVoice {
  explicit: boolean // 是否手动指定了发言角色
  speakers: {
    characterId: number // 角色编号
    name: string // 角色名
    voiceDescription?: string // 声音描述
    sampleAudioUrl?: string // 样音地址
  }[] // 发言角色
  referenceAudios: { url: string, description: string }[] // 参考音频
}

/** AI 短剧镜头视频提交记录 */
export interface DramaVideoSubmission {
  id: number // 编号
  requestId: string // 请求编号：前端每次点击生成
  storyboardId: number // 分镜编号
  parametersHash: string // 提交参数的 SHA-256
  modelId?: number // 模型编号
  model?: string // 提交时的视频模型
  taskId?: string // 服务商任务编号：为空且待处理时，提交结果未知
  status: number // 状态，参见 AiDramaStatusEnum
  videoUrl?: string // 视频地址
  lastFrameUrl?: string // 尾帧地址
  errorMessage?: string // 错误信息
  previousVideo?: { // 提交前的视频
    taskId?: string
    videoStatus?: number
    videoUrl?: string
    lastFrameUrl?: string
  }
  createTime: string // 创建时间
}

/** AI 短剧确认提交结果请求：填写在服务商控制台核对到的任务编号 */
export interface DramaVideoSubmissionResolveReq {
  id: number // 编号
  taskId: string // 服务商任务编号
}

const GENERATE_TIMEOUT = 5 * 60 * 1000 // 同步渲染、转码耗时较长，超时时间放宽到 5 分钟

// ========== 分镜 ==========

/** 创建分镜：返回分镜编号 */
export function createDramaStoryboard(data: DramaStoryboardSaveReq) {
  return http.post<number>('/ai/drama/storyboard/create', data)
}

/** 修改分镜 */
export function updateDramaStoryboard(data: DramaStoryboardSaveReq) {
  return http.put<boolean>('/ai/drama/storyboard/update', data)
}

/** 删除分镜 */
export function deleteDramaStoryboard(id: number) {
  return http.delete<boolean>(`/ai/drama/storyboard/delete?id=${id}`)
}

/** 获得分镜：包括历史剧本版本的分镜；不存在时为空 */
export function getDramaStoryboard(id: number) {
  return http.get<DramaStoryboard | undefined>(`/ai/drama/storyboard/get?id=${id}`)
}

/** 获得剧本版本的分镜列表：只读查看历史版本 */
export function getDramaStoryboardList(scriptId: number) {
  return http.get<DramaStoryboard[]>(`/ai/drama/storyboard/list?scriptId=${scriptId}`)
}

// ========== 镜头视频、关键帧 ==========

/** 生成镜头视频 */
export function generateDramaStoryboardVideo(data: DramaStoryboardVideoReq) {
  return http.post<boolean>('/ai/drama/storyboard/generate-video', data)
}

/** 批量生成镜头视频：id 为项目编号，返回提交的数量 */
export function generateDramaStoryboardVideoBatch(data: DramaStoryboardVideoReq) {
  return http.post<number>('/ai/drama/storyboard/generate-video-batch', data)
}

/** 生成关键帧 */
export function generateDramaStoryboardFrame(data: DramaStoryboardFrameReq) {
  return http.post<boolean>('/ai/drama/storyboard/generate-frame', data)
}

/** 批量生成关键帧：返回提交的数量 */
export function generateDramaStoryboardFrameBatch(data: DramaStoryboardFrameBatchReq) {
  return http.post<number>('/ai/drama/storyboard/generate-frame-batch', data)
}

/** 承接上一镜头：上一镜头视频的尾帧作为本镜的起始帧 */
export function applyDramaPreviousLastFrame(id: number) {
  return http.put<boolean>(`/ai/drama/storyboard/use-previous-last-frame?id=${id}`)
}

/** 素材图片渲染为镜头视频 */
export function renderDramaStoryboardMaterial(id: number) {
  return http.post<boolean>(`/ai/drama/storyboard/render-material?id=${id}`, undefined, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 导入外部视频为镜头视频 */
export function importDramaStoryboardVideo(data: DramaStoryboardImportVideoReq) {
  return http.post<boolean>('/ai/drama/storyboard/import-video', data, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

// ========== 声音 ==========

/** 获得镜头声音预览 */
export function getDramaStoryboardVoice(id: number) {
  return http.get<DramaStoryboardVoice>(`/ai/drama/storyboard/get-voice?id=${id}`)
}

/** 设置发言角色 */
export function updateDramaStoryboardSpeakers(data: DramaStoryboardSpeakerReq) {
  return http.put<boolean>('/ai/drama/storyboard/update-speakers', data)
}

// ========== 视频提交记录 ==========

/** 获得镜头视频提交记录列表 */
export function getDramaVideoSubmissionList(storyboardId: number) {
  return http.get<DramaVideoSubmission[]>(`/ai/drama/storyboard/video-submission/list?storyboardId=${storyboardId}`)
}

/** 提交结果未知：填写在服务商控制台核对到的任务编号 */
export function resolveDramaVideoSubmission(data: DramaVideoSubmissionResolveReq) {
  return http.put<boolean>('/ai/drama/storyboard/video-submission/resolve', data)
}

/** 提交结果未知：确认服务商未创建任务 */
export function confirmDramaVideoSubmissionFail(id: number) {
  return http.put<boolean>(`/ai/drama/storyboard/video-submission/confirm-fail?id=${id}`)
}

/** 使用提交记录的视频：previous 为 true 时恢复提交前的视频 */
export function applyDramaVideoSubmission(id: number, previous: boolean) {
  return http.put<boolean>(`/ai/drama/storyboard/video-submission/use-video?id=${id}&previous=${previous}`)
}
