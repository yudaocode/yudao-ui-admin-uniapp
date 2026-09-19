import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OA 云盘文件节点 */
export interface FileNode {
  id?: number // 节点编号
  parentId: number // 父目录编号
  type: number // 类型：0 目录、1 文件
  name: string // 名称
  url?: string // 上传文件地址；详情返回授权后的临时地址，列表不返回
  extension?: string // 扩展名
  category?: number // 分类
  size?: number // 文件大小，单位字节
  status?: number // 回收状态
  creator?: string // 创建人
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
  level?: number // 当前用户权限级别
  favorite?: boolean // 是否收藏
}

/** OA 云盘空间概览 */
export interface FileStorage {
  usedSize: number // 已用容量，单位字节
  totalSize: number // 总容量，单位字节
  fileCount: number // 本人文件数量，不含目录和回收站
  sharedCount: number // 本人有效共享节点数量
  receivedCount: number // 收到的共享入口数量
}

/** OA 云盘共享权限 */
export interface FilePermission {
  id?: number // 编号
  nodeId: number // 文件节点编号
  subjectType: number // 共享主体类型：1 用户、2 部门
  subjectId?: number // 共享主体编号
  level: number // 权限级别
  inherit: boolean // 是否继承
  expireTime?: string | number // 到期时间
}

/** 查询本人云盘概览 */
export function getFileStorage() {
  return http.get<FileStorage>('/oa/file-node/get-storage')
}

/** 查询云盘文件分页，scope 为 my、shared、favorite、recycle */
export function getFileNodePage(params: PageParam & { scope: string, parentId?: number }) {
  return http.get<PageResult<FileNode>>('/oa/file-node/page', params)
}

/** 查询本人可用目录列表 */
export function getFileDirectoryList() {
  return http.get<FileNode[]>('/oa/file-node/directory-list')
}

/** 创建云盘文件或目录 */
export function createFileNode(data: FileNode) {
  return http.post<number>('/oa/file-node/create', data)
}

/** 重命名云盘文件 */
export function updateFileNodeName(id: number, name: string) {
  return http.put<boolean>('/oa/file-node/update-name', { id, name })
}

/** 移动云盘文件 */
export function updateFileNodeParent(id: number, parentId: number) {
  return http.put<boolean>('/oa/file-node/update-parent', { id, parentId })
}

/** 复制云盘文件或目录 */
export function copyFileNode(id: number, parentId: number) {
  return http.post<boolean>('/oa/file-node/copy', { id, parentId })
}

/** 移入回收站 */
export function recycleFileNode(id: number) {
  return http.put<boolean>(`/oa/file-node/recycle?id=${id}`)
}

/** 恢复回收站文件 */
export function restoreFileNode(id: number) {
  return http.put<boolean>(`/oa/file-node/restore?id=${id}`)
}

/** 彻底删除回收站文件 */
export function deleteFileNode(id: number) {
  return http.delete<boolean>(`/oa/file-node/delete?id=${id}`)
}

/** 查询文件详情，有下载权限时返回授权临时地址 */
export function getFileNode(id: number) {
  return http.get<FileNode>(`/oa/file-node/get?id=${id}`)
}

/** 收藏文件 */
export function createFileFavorite(nodeId: number) {
  return http.post<boolean>(`/oa/file-favorite/create?nodeId=${nodeId}`)
}

/** 取消收藏文件 */
export function deleteFileFavorite(nodeId: number) {
  return http.delete<boolean>(`/oa/file-favorite/delete?nodeId=${nodeId}`)
}

/** 查询文件共享权限 */
export function getFilePermissionList(nodeId: number) {
  return http.get<FilePermission[]>(`/oa/file-permission/list?nodeId=${nodeId}`)
}

/** 保存文件共享权限 */
export function saveFilePermission(data: FilePermission) {
  return http.post<boolean>('/oa/file-permission/save', data)
}

/** 取消文件共享权限 */
export function deleteFilePermission(id: number) {
  return http.delete<boolean>(`/oa/file-permission/delete?id=${id}`)
}
