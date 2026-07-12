import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 绘图 */
export interface AiImage {
  id?: number
  userId?: number
  platform?: string
  model?: string
  prompt?: string
  width?: number
  height?: number
  status?: number
  publicStatus?: boolean
  picUrl?: string
  errorMessage?: string
  options?: Record<string, string>
  taskId?: string
  buttons?: ImageMidjourneyButton[]
  createTime?: string
  finishTime?: string
}

/** AI 图片生成请求 */
export interface ImageDrawReq {
  prompt: string
  modelId: number
  width: number
  height: number
  options?: Record<string, string>
}

/** Midjourney 生成请求 */
export interface ImageMidjourneyImagineReq {
  prompt: string
  modelId: number
  referImageUrl?: string
  width: number
  height: number
  version: string
}

/** Midjourney 操作请求 */
export interface ImageMidjourneyActionReq {
  id: number
  customId: string
}

/** AI 图片更新请求 */
export interface ImageUpdateReq {
  id: number
  publicStatus?: boolean
}

/** Midjourney 操作按钮 */
export interface ImageMidjourneyButton {
  customId: string
  emoji: string
  label: string
  style: number
}

/** 获取我的绘图分页 */
export function getImagePageMy(params: PageParam) {
  return http.get<PageResult<AiImage>>('/ai/image/my-page', params)
}

/** 获取我的绘图记录 */
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

/** 删除我的绘画记录 */
export function deleteImageMy(id: number) {
  return http.delete<boolean>(`/ai/image/delete-my?id=${id}`)
}

/** Midjourney 生成图片 */
export function midjourneyImagine(data: ImageMidjourneyImagineReq) {
  return http.post<number>('/ai/image/midjourney/imagine', data)
}

/** Midjourney 二次生成 */
export function midjourneyAction(data: ImageMidjourneyActionReq) {
  return http.post<number>('/ai/image/midjourney/action', data)
}

/** 查询绘画分页 */
export function getImagePage(params: PageParam) {
  return http.get<PageResult<AiImage>>('/ai/image/page', params)
}

/** 查询绘画详情 */
export function getImage(id: number) {
  return http.get<AiImage>(`/ai/image/get?id=${id}`)
}

/** 更新绘画发布状态 */
export function updateImage(data: ImageUpdateReq) {
  return http.put<boolean>('/ai/image/update', data)
}

/** 删除绘画 */
export function deleteImage(id: number) {
  return http.delete<boolean>(`/ai/image/delete?id=${id}`)
}
