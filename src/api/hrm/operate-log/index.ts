import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** HRM 操作日志 */
export interface HrmOperateLog {
  id?: number // 日志编号
  userId?: number // 操作人用户编号
  userType?: number // 操作人用户类型
  userName?: string // 操作人用户名称
  action?: string // 操作内容
  createTime?: Date | string // 创建时间
}

/** 获得 HRM 操作日志分页 */
export function getHrmOperateLogPage(params: PageParam & { bizType: number, bizId: number }) {
  return http.get<PageResult<HrmOperateLog>>('/hrm/operate-log/page', params)
}
