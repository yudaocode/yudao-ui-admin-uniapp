import type { PageParam, PageResult } from '@/http/types'
import { sendSsePost } from '@/api/ai/utils'
import { http } from '@/http/http'
import type { AiWriteTypeEnum } from '@/pages-ai/utils/constants'

/** AI 写作请求 */
export interface WriteVO {
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

/** AI 写作分页请求 */
export interface AiWritePageReqVO extends PageParam {
  userId?: number
  type?: AiWriteTypeEnum
  platform?: string
  createTime?: [string, string]
}

/** AI 写作响应 */
export interface AiWriteRespVO {
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
  data: WriteVO
  onMessage?: (res: { data: string }) => void | Promise<void>
  onError?: (...args: any[]) => void
  onClose?: (...args: any[]) => void
  ctrl: AbortController
}) {
  return sendSsePost('/ai/write/generate-stream', options)
}

/** 获取写作列表 */
export function getWritePage(params: AiWritePageReqVO) {
  return http.get<PageResult<AiWriteRespVO>>('/ai/write/page', params)
}

/** 删除写作 */
export function deleteWrite(id: number) {
  return http.delete<boolean>(`/ai/write/delete?id=${id}`)
}

/** AI 写作 API */
export const WriteApi = {
  writeStream,
  getWritePage,
  deleteWrite,
}
