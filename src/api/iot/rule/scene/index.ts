import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 场景联动规则 */
export interface IotSceneRule {
  id?: number
  name: string
  description?: string
  lastTriggerTime?: string | Date
  status?: number
  triggers?: Trigger[]
  actions?: Action[]
  createTime?: Date
}

/** 场景联动触发器 */
export interface Trigger {
  type: number
  productId?: number
  deviceId?: number
  identifier?: string
  operator?: string
  value?: string
  cronExpression?: string
  conditionGroups?: TriggerCondition[][]
}

/** 场景联动触发条件 */
export interface TriggerCondition {
  type: number
  productId?: number
  deviceId?: number
  identifier?: string
  operator: string
  param: string
}

/** 场景联动执行器 */
export interface Action {
  type: number
  productId?: number
  deviceId?: number
  identifier?: string
  params?: string
  alertConfigId?: number
}

/** 获取场景联动分页列表 */
export function getRuleScenePage(params: PageParam) {
  return http.get<PageResult<IotSceneRule>>('/iot/scene-rule/page', params)
}

/** 获取场景联动详情 */
export function getRuleScene(id: number) {
  return http.get<IotSceneRule>(`/iot/scene-rule/get?id=${id}`)
}

/** 创建场景联动 */
export function createRuleScene(data: IotSceneRule) {
  return http.post<number>('/iot/scene-rule/create', data)
}

/** 更新场景联动 */
export function updateRuleScene(data: IotSceneRule) {
  return http.put<boolean>('/iot/scene-rule/update', data)
}

/** 更新场景联动状态 */
export function updateRuleSceneStatus(id: number, status: number) {
  return http.put<boolean>('/iot/scene-rule/update-status', { id, status })
}

/** 删除场景联动 */
export function deleteRuleScene(id: number) {
  return http.delete<boolean>(`/iot/scene-rule/delete?id=${id}`)
}

/** 获取场景联动精简列表 */
export function getSimpleRuleSceneList() {
  return http.get<IotSceneRule[]>('/iot/scene-rule/simple-list')
}
