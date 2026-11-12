import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 绘图 */
export interface AiImage {
  id: number // 编号
  userId?: number // 用户编号；公开画廊不返回
  platform: string // 平台
  mode: number // 生成方式，参见 AiImageModeEnum
  modelId?: number // 模型编号
  model: string // 模型
  apiKeyId?: number // API 密钥编号；公开画廊不返回
  prompt: string // 提示词
  negativePrompt?: string // 不希望出现的内容
  inputImages?: AiImageInputImage[] // 输入图片
  width?: number // 图片宽度；0 表示未知
  height?: number // 图片高度；0 表示未知
  status: number // 绘画状态，参见 AiImageStatusEnum
  progress: number // 进度（0-100）
  publicStatus: boolean // 是否公开
  picUrl?: string // 图片地址
  errorMessage?: string // 错误信息；公开画廊不返回
  options?: AiImageOptions // 通用模型的绘制参数
  midjourneyOptions?: AiImageMidjourneyOptions // Midjourney 的绘制参数
  seedreamOptions?: AiImageSeedreamOptions // Seedream 的绘制参数
  taskId?: string // 上游任务编号；公开画廊不返回
  parentId?: number // 来源记录编号
  children?: AiImage[] // 派生记录；只在详情返回
  finishTime?: string // 完成时间
  createTime: string // 创建时间
}

/** AI 绘图输入图片 */
export interface AiImageInputImage {
  role: string // 角色，参见 AiImageInputRoleEnum
  url: string // 图片地址
}

/** AI 绘图通用模型的绘制参数 */
export interface AiImageOptions {
  quality?: string // 画质（OpenAI）
  aspectRatio?: string // 比例：只用于回填
  seed?: number // 随机种子
  steps?: number // 推理步数
  cfgScale?: number // 引导系数
  sampler?: string // 采样器（Stability）
  stylePreset?: string // 风格预设（Stability）
  clipGuidancePreset?: string // CLIP 引导（Stability）
  style?: string // 历史 OpenAI DALL·E 风格
}

/** AI 绘图 Midjourney 的绘制参数 */
export interface AiImageMidjourneyOptions {
  version?: string // 版本参数，例如 --v 7
  aspectRatio?: string // 比例 --ar
  quality?: number // 画质 --q
  stylize?: number // 风格化 --s
  chaos?: number // 创意度 --c
  seed?: number // 随机种子 --seed
  tile?: boolean // 平铺 --tile
  raw?: boolean // RAW --raw
  hd?: boolean // HD --hd
  imageWeight?: number // 图片权重 --iw
  characterWeight?: number // 角色权重 --cw
  styleWeight?: number // 风格权重 --sw
  styleVersion?: number // 风格版本 --sv
  dimensions?: string // 融图尺寸：PORTRAIT / SQUARE / LANDSCAPE
  customId?: string // 执行的按钮
  finalPrompt?: string // 实际提交的完整提示词
  buttons?: AiImageMidjourneyButton[] // 中转返回的按钮
  actionLabel?: string // 按钮动作的名称，例如 U2、V3
  providerStatus?: string // 中转的任务状态
  modalProtocol?: string // 局部重绘的中转流程
  legacy?: boolean // 是否由历史平铺 options 迁移而来
}

/** AI 绘图 Midjourney 按钮 */
export interface AiImageMidjourneyButton {
  customId: string // 动作标识，例如 MJ::JOB::upsample::1::85a4b4c1-8835-46c5-a15c-aea34fad1862
  emoji?: string // 图标
  label?: string // 文本，例如 U1、V1
  type?: string // 类型
  style?: string // 样式
}

/** AI 绘图 Seedream 的绘制参数 */
export interface AiImageSeedreamOptions {
  size?: string // 尺寸档位，例如 2K
  optimizePromptMode?: string // 提示词优化模式
  watermark?: boolean // 是否添加水印
  resultSize?: string // 结果图片的尺寸，例如 2048x2048
  usage?: Record<string, any> // 用量
  errorCode?: string // 上游错误码
}

/** AI 绘图（通用模型、Seedream）请求 */
export interface ImageDrawReq {
  modelId: number // 模型编号
  prompt: string // 提示词
  negativePrompt?: string // 不希望出现的内容
  referenceImageUrls?: string[] // 参考图地址数组
  width?: number // 图片宽度
  height?: number // 图片高度
  sizeLevel?: string // 尺寸档位（Seedream）
  aspectRatio?: string // 比例（只用于回填）
  quality?: string // 画质（OpenAI）
  seed?: number // 随机种子
  steps?: number // 推理步数
  cfgScale?: number // 引导系数
  sampler?: string // 采样器（Stability）
  stylePreset?: string // 风格预设（Stability）
  clipGuidancePreset?: string // CLIP 引导（Stability）
}

/** Midjourney 文生图、图生图、一致性请求 */
export interface ImageMidjourneyImagineReq {
  modelId: number // 模型编号
  mode: number // 生成方式：20 文生图、21 图生图、24 一致性
  prompt: string // 提示词
  negativePrompt?: string // 不希望出现的内容（拼接为 --no）
  version: string // 版本参数，例如 --v 7
  aspectRatio: string // 比例
  quality?: number // 画质 --q
  stylize?: number // 风格化 --s
  chaos?: number // 创意度 --c
  seed?: number // 随机种子 --seed，-1 表示随机
  tile?: boolean // 平铺 --tile
  raw?: boolean // RAW --raw
  hd?: boolean // HD --hd
  referenceImageUrls?: string[] // 参考图地址数组（图生图 1-5 张）
  imageWeight?: number // 图片权重 --iw
  crefUrl?: string // 角色参考图地址 --cref
  characterWeight?: number // 角色权重 --cw
  srefUrl?: string // 风格参考图地址 --sref
  styleWeight?: number // 风格权重 --sw
  styleVersion?: number // 风格版本 --sv
}

/** Midjourney 融图请求 */
export interface ImageMidjourneyBlendReq {
  modelId: number // 模型编号
  imageUrls: string[] // 融图图片地址数组（2-5 张）
  dimensions: string // 融图尺寸：PORTRAIT、SQUARE、LANDSCAPE
}

/** Midjourney 换脸请求 */
export interface ImageMidjourneySwapFaceReq {
  modelId: number // 模型编号
  sourceUrl: string // 来源脸图片地址
  targetUrl: string // 目标图片地址
}

/** Midjourney 按钮动作请求 */
export interface ImageMidjourneyActionReq {
  id: number // 图片编号
  customId: string // 按钮的动作标识
}

/** AI 绘图公开状态更新请求 */
export interface ImageUpdateReq {
  id: number // 编号
  publicStatus: boolean // 是否公开
}

// ========== 我的作品、公开画廊 ==========

/** 获取我的绘图分页 */
export function getImagePageMy(params: PageParam) {
  return http.get<PageResult<AiImage>>('/ai/image/my-page', params)
}

/** 获取公开的绘图分页 */
export function getImagePagePublic(params: PageParam) {
  return http.get<PageResult<AiImage>>('/ai/image/public-page', params)
}

/** 获取公开的绘图 */
export function getImagePublic(id: number) {
  return http.get<AiImage>(`/ai/image/get-public?id=${id}`)
}

/** 获取我的绘图记录：包含按钮动作产生的派生记录 */
export function getImageMy(id: number) {
  return http.get<AiImage>(`/ai/image/get-my?id=${id}`)
}

/** 获取我的绘图记录列表 */
export function getImageListMyByIds(ids: number[]) {
  return http.get<AiImage[]>('/ai/image/my-list-by-ids', { ids: ids.join(',') })
}

/** 生成图片 */
export function drawImage(data: ImageDrawReq) {
  return http.post<number>('/ai/image/draw', data)
}

/** 生成专业绘画指令 */
export function optimizePrompt(prompt: string) {
  return http.post<string>('/ai/image/optimize-prompt', { prompt })
}

/** 删除我的绘画记录 */
export function deleteImageMy(id: number) {
  return http.delete<boolean>(`/ai/image/delete-my?id=${id}`)
}

/** 公开 / 取消公开我的绘画记录 */
export function updateImagePublicMy(data: ImageUpdateReq) {
  return http.put<boolean>('/ai/image/update-public-my', data)
}

// ========== Midjourney 专属 ==========

/** Midjourney 文生图、图生图、一致性 */
export function midjourneyImagine(data: ImageMidjourneyImagineReq) {
  return http.post<number>('/ai/image/midjourney/imagine', data)
}

/** Midjourney 融图 */
export function midjourneyBlend(data: ImageMidjourneyBlendReq) {
  return http.post<number>('/ai/image/midjourney/blend', data)
}

/** Midjourney 换脸 */
export function midjourneySwapFace(data: ImageMidjourneySwapFaceReq) {
  return http.post<number>('/ai/image/midjourney/swap-face', data)
}

/** Midjourney 按钮动作（二次生成图片） */
export function midjourneyAction(data: ImageMidjourneyActionReq) {
  return http.post<number>('/ai/image/midjourney/action', data)
}

// ========== 绘图管理 ==========

/** 查询绘画分页 */
export function getImagePage(params: PageParam) {
  return http.get<PageResult<AiImage>>('/ai/image/page', params)
}

/** 查询绘画详情：包含按钮动作产生的派生记录 */
export function getImage(id: number) {
  return http.get<AiImage>(`/ai/image/get?id=${id}`)
}

/** 更新绘画公开状态 */
export function updateImage(data: ImageUpdateReq) {
  return http.put<boolean>('/ai/image/update', data)
}

/** 删除绘画 */
export function deleteImage(id: number) {
  return http.delete<boolean>(`/ai/image/delete?id=${id}`)
}
