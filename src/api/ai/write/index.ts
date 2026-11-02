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
  requestId?: string | null // 请求编号；历史记录可能为空
  inputTokens?: number | null // 输入 Token，未知为空
  outputTokens?: number | null // 输出 Token，未知为空
  totalTokens?: number | null // 合计 Token，未知为空
  createTime: string
}

/** AI 写作流式生成响应（CommonResult.data） */
export interface AiWriteGenerateResp {
  id: number // 业务编号
  content: string // 本次增量内容；仅携带用量的尾帧为空串
  inputTokens: number | null // 输入 Token 最新快照，未知为空
  outputTokens: number | null // 输出 Token 最新快照，未知为空
  totalTokens: number | null // 合计 Token 最新快照，未知为空
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
