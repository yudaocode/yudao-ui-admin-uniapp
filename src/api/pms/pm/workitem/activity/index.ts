import { http } from '@/http/http'

/** PMS 工作项动态 */
export interface WorkItemActivity {
  id: number // 动态编号
  workItemId: number // 工作项编号
  operatorUserId: number // 操作人用户编号
  operatorUserName?: string // 操作人姓名
  operatorUserAvatar?: string // 操作人头像
  content: string // 动态内容
  createTime: number // 创建时间
}

/** 查询工作项动态列表 */
export function getWorkItemActivityList(workItemId: number) {
  return http.get<WorkItemActivity[]>('/pms/pm/work-item-activity/list', { workItemId })
}
