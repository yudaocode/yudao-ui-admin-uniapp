import { http } from '@/http/http'

/** 流程定义 */
export interface ProcessDefinition {
  id: string
  key: string
  name: string
  description?: string
  category: string
  formType?: number
  formId?: number
  formCustomCreatePath?: string
  formCustomViewPath?: string
  suspensionState: number
}

/** 获取流程定义列表 */
export function getProcessDefinitionList(params?: { suspensionState?: number }) {
  return http.get<ProcessDefinition[]>('/bpm/process-definition/list', params)
}
