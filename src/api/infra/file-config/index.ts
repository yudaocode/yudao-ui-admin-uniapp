import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 文件客户端配置 */
export interface FileClientConfig {
  basePath?: string
  host?: string
  port?: number
  username?: string
  password?: string
  mode?: string
  endpoint?: string
  bucket?: string
  accessKey?: string
  accessSecret?: string
  enablePathStyleAccess?: boolean
  enablePublicAccess?: boolean
  region?: string
  domain?: string
}

/** 文件配置信息 */
export interface FileConfig {
  id?: number
  name: string
  storage?: number
  master?: boolean
  visible?: boolean
  config?: FileClientConfig
  remark?: string
  createTime?: Date
}

/** 查询文件配置分页列表 */
export function getFileConfigPage(params: PageParam) {
  return http.get<PageResult<FileConfig>>('/infra/file-config/page', params)
}

/** 查询文件配置详情 */
export function getFileConfig(id: number) {
  return http.get<FileConfig>(`/infra/file-config/get?id=${id}`)
}

/** 新增文件配置 */
export function createFileConfig(data: FileConfig) {
  return http.post<number>('/infra/file-config/create', data)
}

/** 修改文件配置 */
export function updateFileConfig(data: FileConfig) {
  return http.put<boolean>('/infra/file-config/update', data)
}

/** 删除文件配置 */
export function deleteFileConfig(id: number) {
  return http.delete<boolean>(`/infra/file-config/delete?id=${id}`)
}

/** 更新文件配置为主配置 */
export function updateFileConfigMaster(id: number) {
  return http.put<boolean>(`/infra/file-config/update-master?id=${id}`)
}

/** 测试文件配置 */
export function testFileConfig(id: number) {
  return http.get<string>(`/infra/file-config/test?id=${id}`)
}
