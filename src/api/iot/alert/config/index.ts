import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT 告警配置信息 */
export interface AlertConfig {
  id?: number
  name?: string
  description?: string
  level?: number
  status?: number
  sceneRuleIds?: number[]
  receiveUserIds?: number[]
  receiveUserNames?: string[]
  receiveTypes?: number[]
  smsTemplateCode?: string
  mailTemplateCode?: string
  notifyTemplateCode?: string
  createTime?: Date
}

/** 获取告警配置分页列表 */
export function getAlertConfigPage(params: PageParam) {
  return http.get<PageResult<AlertConfig>>('/iot/alert-config/page', params)
}

/** 获取告警配置详情 */
export function getAlertConfig(id: number) {
  return http.get<AlertConfig>(`/iot/alert-config/get?id=${id}`)
}

/** 创建告警配置 */
export function createAlertConfig(data: AlertConfig) {
  return http.post<number>('/iot/alert-config/create', data)
}

/** 更新告警配置 */
export function updateAlertConfig(data: AlertConfig) {
  return http.put<boolean>('/iot/alert-config/update', data)
}

/** 删除告警配置 */
export function deleteAlertConfig(id: number) {
  return http.delete<boolean>(`/iot/alert-config/delete?id=${id}`)
}

/** 获取告警配置精简列表 */
export function getSimpleAlertConfigList() {
  return http.get<AlertConfig[]>('/iot/alert-config/simple-list')
}
