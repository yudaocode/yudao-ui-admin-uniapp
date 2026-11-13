import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 技能 */
export interface Skill {
  id?: number
  name?: string // 名称：小写字母、数字、中划线，创建后不可修改
  description?: string // 描述：以 SKILL.md 头信息为准
  version?: string
  status?: number
  remark?: string
  fileCount?: number // 文件数量
  roleNames?: string[] // 引用的角色名称
  createTime?: string
  updateTime?: string
}

/** AI 技能文件 */
export interface SkillFile {
  id: number
  skillId: number
  parentId: number // 父目录编号，根目录为 0
  name: string
  type: number // 类型，参见 AiSkillFileTypeEnum
  fileType?: string // 文件扩展名
  content?: string
  size?: number // 内容字节数
  locked: boolean // 是否固定：不可重命名、移动、删除
  sort: number
  createTime?: string
  updateTime?: string
}

/** 新增技能文件请求 */
export interface SkillFileCreateReq {
  skillId: number
  parentId: number
  name: string
  type: number
}

/** 查询技能分页 */
export function getSkillPage(params: PageParam) {
  return http.get<PageResult<Skill>>('/ai/skill/page', params)
}

/** 查询技能详情 */
export function getSkill(id: number) {
  return http.get<Skill>(`/ai/skill/get?id=${id}`)
}

/** 查询启用的技能精简列表：只有编号、名称、描述 */
export function getSimpleSkillList() {
  return http.get<Skill[]>('/ai/skill/simple-list')
}

/** 新增技能 */
export function createSkill(data: Skill) {
  return http.post<number>('/ai/skill/create', data)
}

/** 修改技能 */
export function updateSkill(data: Skill) {
  return http.put<boolean>('/ai/skill/update', data)
}

/** 删除技能 */
export function deleteSkill(id: number) {
  return http.delete<boolean>(`/ai/skill/delete?id=${id}`)
}

/** 查询技能文件列表 */
export function getSkillFileList(skillId: number) {
  return http.get<SkillFile[]>(`/ai/skill/file/list?skillId=${skillId}`)
}

/** 查询技能文件详情 */
export function getSkillFile(id: number) {
  return http.get<SkillFile>(`/ai/skill/file/get?id=${id}`)
}

/** 新增技能文件 */
export function createSkillFile(data: SkillFileCreateReq) {
  return http.post<number>('/ai/skill/file/create', data)
}

/** 重命名技能文件 */
export function renameSkillFile(data: { id: number, name: string }) {
  return http.put<boolean>('/ai/skill/file/rename', data)
}

/** 移动技能文件 */
export function moveSkillFile(data: { id: number, parentId: number }) {
  return http.put<boolean>('/ai/skill/file/move', data)
}

/** 修改技能文件内容 */
export function updateSkillFileContent(data: { id: number, content: string }) {
  return http.put<boolean>('/ai/skill/file/update-content', data)
}

/** 删除技能文件 */
export function deleteSkillFile(id: number) {
  return http.delete<boolean>(`/ai/skill/file/delete?id=${id}`)
}
