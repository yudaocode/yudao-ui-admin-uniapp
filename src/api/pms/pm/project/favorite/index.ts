import { http } from '@/http/http'

/** 收藏项目 */
export function createProjectFavorite(projectId: number) {
  return http.post<boolean>('/pms/pm/project-favorite/create', undefined, { projectId })
}

/** 取消收藏项目 */
export function deleteProjectFavorite(projectId: number) {
  return http.delete<boolean>('/pms/pm/project-favorite/delete', undefined, { projectId })
}
