import type { PageParam, PageResult } from '@/http/types'
import { sendSsePost } from '@/api/ai/utils'
import { http } from '@/http/http'

/** AI 思维导图 */
export interface MindMapVO {
  id?: number
  userId?: number
  prompt?: string
  generatedContent?: string
  platform?: string
  model?: string
  errorMessage?: string
  createTime?: string
}

/** AI 思维导图生成请求 */
export interface AiMindMapGenerateReq {
  prompt: string
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
  return http.get<PageResult<MindMapVO>>('/ai/mind-map/page', params)
}

/** 查询思维导图详情 */
export function getMindMap(id: number) {
  return http.get<MindMapVO>(`/ai/mind-map/get?id=${id}`)
}

/** 删除思维导图 */
export function deleteMindMap(id: number) {
  return http.delete<boolean>(`/ai/mind-map/delete?id=${id}`)
}
