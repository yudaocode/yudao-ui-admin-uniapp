import type { PageParam, PageResult } from '@/http/types'
import { sendSsePost } from '@/http/sse'
import { http } from '@/http/http'

/** AI 思维导图 */
export interface MindMap {
  id?: number
  userId?: number
  prompt?: string
  generatedContent?: string
  platform?: string
  model?: string
  errorMessage?: string
  requestId?: string | null // 请求编号；历史记录可能为空
  inputTokens?: number | null // 输入 Token，未知为空
  outputTokens?: number | null // 输出 Token，未知为空
  totalTokens?: number | null // 合计 Token，未知为空
  createTime?: string
}

/** AI 思维导图生成请求 */
export interface AiMindMapGenerateReq {
  prompt: string
}

/** AI 思维导图流式生成响应（CommonResult.data） */
export interface AiMindMapGenerateResp {
  id: number // 业务编号
  content: string // 本次增量内容；仅携带用量的尾帧为空串
  inputTokens: number | null // 输入 Token 最新快照，未知为空
  outputTokens: number | null // 输出 Token 最新快照，未知为空
  totalTokens: number | null // 合计 Token 最新快照，未知为空
}

/** 流式生成思维导图 */
export function generateMindMap(options: {
  data: AiMindMapGenerateReq
  onMessage?: (res: { data: string }) => void | Promise<void>
  onError?: (...args: any[]) => void
  onClose?: (...args: any[]) => void
  ctrl: AbortController
}) {
  return sendSsePost('/ai/mind-map/generate-stream', options)
}

/** 查询思维导图分页 */
export function getMindMapPage(params: PageParam) {
  return http.get<PageResult<MindMap>>('/ai/mind-map/page', params)
}

/** 查询思维导图详情 */
export function getMindMap(id: number) {
  return http.get<MindMap>(`/ai/mind-map/get?id=${id}`)
}

/** 删除思维导图 */
export function deleteMindMap(id: number) {
  return http.delete<boolean>(`/ai/mind-map/delete?id=${id}`)
}
