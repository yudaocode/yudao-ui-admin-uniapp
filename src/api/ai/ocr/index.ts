import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 文字识别记录 */
export interface Ocr {
  id: number // 编号
  modelId: number // 模型编号
  modelName?: string // 模型名字
  platform: string // 平台
  model?: string // 模型标识
  fileName: string // 图片文件名
  imageUrl: string // 图片地址
  status: number // 识别状态，参见 AiOcrStatusEnum
  originalText?: string | null // 识别出的原文
  errorMessage?: string // 失败原因
  duration?: number // 识别耗时，单位：毫秒
  createTime: string // 创建时间
  updateTime: string // 更新时间
}

/** AI 文字识别模型：不包含密钥 */
export interface OcrModel {
  id: number // 编号
  name: string // 模型名字
  platform: string // 平台
  model?: string // 模型标识
  description?: string // 模型简介
}

/** AI 文字识别请求 */
export interface OcrRecognizeReq {
  modelId: number // 模型编号
  fileUrl: string // 图片地址，先上传到文件服务
}

const RECOGNIZE_TIMEOUT = 2 * 60 * 1000 // 同步识别，超时时间放宽到 2 分钟

/** 获得可用的文字识别模型列表 */
export function getOcrModelList() {
  return http.get<OcrModel[]>('/ai/ocr/model-list')
}

/** 识别图片中的文字：图片先上传到文件服务，同步返回识别记录，成功、失败都会新增一条记录 */
export function recognizeOcr(data: OcrRecognizeReq) {
  return http.post<Ocr>('/ai/ocr/recognize', data, undefined, undefined, { timeout: RECOGNIZE_TIMEOUT })
}

/** 获得【我的】识别记录分页 */
export function getOcrMyPage(params: PageParam) {
  return http.get<PageResult<Ocr>>('/ai/ocr/my-page', params)
}

/** 获得【我的】识别记录 */
export function getOcrMy(id: number) {
  return http.get<Ocr>(`/ai/ocr/get-my?id=${id}`)
}

/** 删除【我的】识别记录 */
export function deleteOcrMy(id: number) {
  return http.delete<boolean>(`/ai/ocr/delete-my?id=${id}`)
}
