import { http } from '@/http/http'

/** 数据源配置信息 */
export interface DataSourceConfig {
  id?: number
  name: string
  url: string
  username: string
  password: string
  createTime?: Date
}

/** 获取数据源配置列表（无分页） */
export function getDataSourceConfigList() {
  return http.get<DataSourceConfig[]>('/infra/data-source-config/list')
}

/** 获取数据源配置详情 */
export function getDataSourceConfig(id: number) {
  return http.get<DataSourceConfig>(`/infra/data-source-config/get?id=${id}`)
}

/** 创建数据源配置 */
export function createDataSourceConfig(data: DataSourceConfig) {
  return http.post<number>('/infra/data-source-config/create', data)
}

/** 更新数据源配置 */
export function updateDataSourceConfig(data: DataSourceConfig) {
  return http.put<boolean>('/infra/data-source-config/update', data)
}

/** 删除数据源配置 */
export function deleteDataSourceConfig(id: number) {
  return http.delete<boolean>(`/infra/data-source-config/delete?id=${id}`)
}
