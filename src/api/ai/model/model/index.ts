import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 模型 */
export interface AiModel {
  id?: number
  keyId?: number
  name?: string
  description?: string // 模型简介
  iconUrl?: string // 模型图标地址
  model?: string
  platform?: string
  type?: number
  sort?: number
  status?: number
  temperature?: number
  maxTokens?: number
  maxContexts?: number
  inputModalities?: string[] // 输入模态数组
  reasoningConfig?: AiModelReasoningConfig // 思考配置；表单不编辑，修改时随详情原样提交
  createTime?: string
}

/** AI 模型的思考配置 */
export interface AiModelReasoningConfig {
  levels: AiModelReasoningLevel[] // 档位数组，从低到高；为空表示清空
  defaultLevel?: string // 默认档位
}

/** AI 模型的思考档位 */
export interface AiModelReasoningLevel {
  level: string // 档位值
  options: Record<string, unknown> // 思考参数
}

/** 查询模型分页 */
export function getModelPage(params: PageParam) {
  return http.get<PageResult<AiModel>>('/ai/model/page', params)
}

/** 获得模型列表 */
export function getModelSimpleList(type?: number, platform?: string) {
  return http.get<AiModel[]>('/ai/model/simple-list', { type, platform })
}

/** 查询模型详情 */
export function getModel(id: number) {
  return http.get<AiModel>(`/ai/model/get?id=${id}`)
}

/** 新增模型 */
export function createModel(data: AiModel) {
  return http.post<number>('/ai/model/create', data)
}

/** 修改模型 */
export function updateModel(data: AiModel) {
  return http.put<boolean>('/ai/model/update', data)
}

/** 删除模型 */
export function deleteModel(id: number) {
  return http.delete<boolean>(`/ai/model/delete?id=${id}`)
}
