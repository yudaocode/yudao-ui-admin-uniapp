import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 参数配置信息 */
export interface Config {
  id?: number
  category: string
  name: string
  key: string
  value: string
  type: number
  visible: boolean
  remark: string
  createTime?: Date
}

/** 获取参数配置分页列表 */
export function getConfigPage(params: PageParam) {
  return http.get<PageResult<Config>>('/infra/config/page', params)
}

/** 获取参数配置详情 */
export function getConfig(id: number) {
  return http.get<Config>(`/infra/config/get?id=${id}`)
}

/** 根据参数键名查询参数值 */
export function getConfigKey(configKey: string) {
  return http.get<string>(`/infra/config/get-value-by-key?key=${configKey}`)
}

/** 创建参数配置 */
export function createConfig(data: Config) {
  return http.post<number>('/infra/config/create', data)
}

/** 更新参数配置 */
export function updateConfig(data: Config) {
  return http.put<boolean>('/infra/config/update', data)
}

/** 删除参数配置 */
export function deleteConfig(id: number) {
  return http.delete<boolean>(`/infra/config/delete?id=${id}`)
}
