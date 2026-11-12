import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 音乐 */
export interface Music {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称
  generateMode: number // 生成模式，参见 AiMusicGenerateModeEnum
  platform: string // 平台
  modelId: number // 模型编号
  model: string // 模型标识
  apiKeyId?: number // API 密钥编号，仅管理端返回
  apiKeyName?: string // API 密钥名称，仅管理端详情返回
  title?: string // 音乐名称
  prompt?: string // 歌曲描述（灵感模式）
  lyric?: string // 歌词
  tags?: string // 音乐风格，逗号分隔
  makeInstrumental?: boolean // 是否纯音乐
  refMusicId?: number // 来源音乐编号（续写、拼接）
  extendSeconds?: number // 续写起点（秒）
  coverUrl?: string // 封面地址
  audioUrl?: string // 音频地址
  videoUrl?: string // 视频地址
  duration?: number // 时长（秒）
  status: number // 状态，参见 AiMusicStatusEnum
  progress?: number // 进度（0-100）
  errorMessage?: string // 错误信息
  publicStatus: boolean // 是否公开
  playCount?: number // 播放次数
  taskId?: string // 中转任务编号，仅管理端返回
  clipId?: string // 中转歌曲编号，仅管理端返回
  finishTime?: string // 完成时间
  createTime: string // 创建时间
}

/** AI 音乐生成（灵感、自定义）请求 */
export interface MusicGenerateReq {
  generateMode: number // 生成模式：1 灵感、2 自定义
  modelId: number // 模型编号
  prompt?: string // 歌曲描述（灵感模式）
  lyric?: string // 歌词（自定义模式）
  tags?: string // 音乐风格（自定义模式）
  title?: string // 歌曲名称（自定义模式）
  makeInstrumental?: boolean // 是否纯音乐
}

/** AI 音乐续写请求 */
export interface MusicExtendReq {
  id: number // 来源音乐编号
  extendSeconds: number // 续写起点（秒）
  lyric?: string // 歌词
  tags?: string // 音乐风格
  title: string // 歌曲名称
}

/** AI 音乐上传请求 */
export interface MusicUploadReq {
  modelId: number // 模型编号
  fileUrl: string // 音频文件地址，只支持 mp3、wav
  title?: string // 歌曲名称，默认取文件名
}

/** AI 音乐歌词响应 */
export interface MusicLyricResp {
  title?: string // 歌曲名称
  lyric: string // 歌词
}

/** 修改我的音乐请求 */
export interface MusicUpdateMyReq {
  id: number // 编号
  title?: string // 音乐名称
  coverUrl?: string // 封面地址
  publicStatus?: boolean // 是否公开
}

/** 修改音乐请求（管理端） */
export interface MusicUpdateReq {
  id: number // 编号
  publicStatus: boolean // 是否公开
}

// ========== 创作 ==========

/** 生成音乐（灵感、自定义） */
export function generateMusic(data: MusicGenerateReq) {
  return http.post<number>('/ai/music/generate', data)
}

/** 续写音乐 */
export function extendMusic(data: MusicExtendReq) {
  return http.post<number>('/ai/music/extend', data)
}

/** 拼接音乐 */
export function concatMusic(id: number) {
  return http.post<number>('/ai/music/concat', { id })
}

/** 上传音乐 */
export function uploadMusic(data: MusicUploadReq) {
  return http.post<number>('/ai/music/upload', data)
}

/** 生成歌词 */
export function generateLyric(prompt: string) {
  return http.post<MusicLyricResp>('/ai/music/generate-lyric', { prompt })
}

// ========== 我的作品、音乐广场 ==========

/** 获得我的音乐分页 */
export function getMusicMyPage(params: PageParam) {
  return http.get<PageResult<Music>>('/ai/music/my-page', params)
}

/** 获得音乐广场分页 */
export function getMusicPublicPage(params: PageParam) {
  return http.get<PageResult<Music>>('/ai/music/public-page', params)
}

/** 获得音乐详情（本人，或已公开） */
export function getMusicDetail(id: number) {
  return http.get<Music>(`/ai/music/get-detail?id=${id}`)
}

/** 修改我的音乐：名称、封面、是否公开 */
export function updateMyMusic(data: MusicUpdateMyReq) {
  return http.put<boolean>('/ai/music/update-my', data)
}

/** 删除我的音乐 */
export function deleteMusicMy(id: number) {
  return http.delete<boolean>(`/ai/music/delete-my?id=${id}`)
}

/** 记录播放 */
export function playMusic(id: number) {
  return http.post<boolean>(`/ai/music/play?id=${id}`)
}

// ========== 音乐管理 ==========

/** 获得音乐分页 */
export function getMusicPage(params: PageParam) {
  return http.get<PageResult<Music>>('/ai/music/page', params)
}

/** 获得音乐详情；不存在（例如已删除）时返回 null */
export function getMusic(id: number) {
  return http.get<Music | null>(`/ai/music/get?id=${id}`)
}

/** 更新音乐 */
export function updateMusic(data: MusicUpdateReq) {
  return http.put<boolean>('/ai/music/update', data)
}

/** 删除音乐 */
export function deleteMusic(id: number) {
  return http.delete<boolean>(`/ai/music/delete?id=${id}`)
}
