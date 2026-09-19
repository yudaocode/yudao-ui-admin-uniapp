import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 用品领用发放明细 */
export interface SupplyIssue {
  id: number // 明细编号
  applyId?: number // 申请编号
  itemId?: number // 用品编号
  itemName?: string // 物品名称
  model?: string // 规格型号
  unit?: string // 计量单位
  manageType?: number // 管理类型，字典 oa_supply_manage_type
  applyQuantity?: number // 申请数量
  issuedQuantity?: number // 实发数量
  returnedQuantity?: number // 已归还数量
  status?: number // 明细状态，字典 oa_supply_item_status
  issueUserId?: number // 发放人编号
  issueUserName?: string // 发放人
  issueTime?: number // 发放时间
  issueRemark?: string // 发放备注
  returnRemark?: string // 归还备注
  no?: string // 申请单号
  creatorName?: string // 申请人
  deptName?: string // 申请部门
  useType?: number // 使用类型，字典 oa_supply_use_type
  createTime?: number // 申请时间
}

/** 获得用品领用发放分页 */
export function getSupplyIssuePage(params: Record<string, any>) {
  return http.get<PageResult<SupplyIssue>>('/oa/supply-issue/page', params)
}

/** 用品发放 */
export function issueSupplyItem(data: { id: number, issuedQuantity: number, issueRemark?: string }) {
  return http.put<boolean>('/oa/supply-issue/issue', data)
}

/** 用品归还 */
export function returnSupplyItem(data: { id: number, quantity: number, returnRemark?: string }) {
  return http.put<boolean>('/oa/supply-issue/return', data)
}
