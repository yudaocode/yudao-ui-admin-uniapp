import type { PageParam, PageResult } from '@/http/types'
import { sendSsePost } from '@/http/sse'
import { http } from '@/http/http'
import type { AiWriteTypeEnum } from '@/utils/constants'

/** AI 写作请求 */
export interface AiWriteGenerateReq {
  type: AiWriteTypeEnum
  prompt: string
  originalContent?: string
  length?: number
  format?: number
  tone?: number
  language?: number
  userId?: number
  platform?: string
  model?: string
  generatedContent?: string
  errorMessage?: string
  createTime?: string
}

/** AI 写作 */
export interface AiWrite {
  id: number
  userId: number
  type: number
  platform: string
  model: string
  prompt: string
  generatedContent: string
  originalContent: string
  length: number
  format: number
  tone: number
  language: number
  errorMessage: string
  createTime: string
}

/** 流式写作 */
export function writeStream(options: {
  data: AiWriteGenerateReq
  onMessage?: (res: { data: string }) => void | Promise<void>
  onError?: (...args: any[]) => void
  onClose?: (...args: any[]) => void
  ctrl: AbortController
}) {
  return sendSsePost('/ai/write/generate-stream', options)
}

/** 获取写作列表 */
export function getWritePage(params: PageParam) {
  return http.get<PageResult<AiWrite>>('/ai/write/page', params)
}

/** 获取写作详情 */
export function getWrite(id: number) {
  return http.get<AiWrite>(`/ai/write/get?id=${id}`)
}

/** 删除写作 */
export function deleteWrite(id: number) {
  return http.delete<boolean>(`/ai/write/delete?id=${id}`)
}
