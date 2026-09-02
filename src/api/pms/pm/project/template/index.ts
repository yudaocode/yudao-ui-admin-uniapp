import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** PMS 项目模板状态 */
export interface ProjectTemplateStatus {
  code: string // 模板内稳定编码
  name: string // 状态名称
  workItemType: number // 工作项类型
  statusType: number // 语义状态
  defaultStatus: boolean // 是否为初始状态
  sort: number // 显示顺序
  boardCode: string // 所属看板列编码
}

/** PMS 项目模板看板列 */
export interface ProjectTemplateBoard {
  code: string // 模板内稳定编码
  name: string // 看板列名称
  workItemType: number // 工作项类型
  sort: number // 显示顺序
  statusCodes: string[] // 关联的状态编码列表
}

/** PMS 项目模板 */
export interface ProjectTemplate {
  id?: number // 模板编号
  name: string // 模板名称
  description?: string // 模板描述
  projectType: number // 项目类型
  status: number // 模板状态
  sort: number // 显示顺序
  itemTypes: number[] // 启用的工作项类型列表
  statuses: ProjectTemplateStatus[] // 工作项状态模板列表
  boards: ProjectTemplateBoard[] // 看板列模板列表
  createTime?: number // 创建时间
}

/** 查询项目模板分页 */
export function getProjectTemplatePage(params: PageParam & Record<string, any>) {
  return http.get<PageResult<ProjectTemplate>>('/pms/pm/project-template/page', params)
}

/** 查询项目模板详情 */
export function getProjectTemplate(id: number) {
  return http.get<ProjectTemplate>('/pms/pm/project-template/get', { id })
}

/** 新增项目模板 */
export function createProjectTemplate(data: ProjectTemplate) {
  return http.post<number>('/pms/pm/project-template/create', data)
}

/** 修改项目模板 */
export function updateProjectTemplate(data: ProjectTemplate) {
  return http.put<boolean>('/pms/pm/project-template/update', data)
}

/** 删除项目模板 */
export function deleteProjectTemplate(id: number) {
  return http.delete<boolean>('/pms/pm/project-template/delete', undefined, { id })
}
