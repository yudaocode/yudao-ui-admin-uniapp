import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** FMS 凭证分录辅助核算项目 */
export interface VoucherAuxiliaryItem {
  typeId: number // 辅助核算类别编号
  itemId: number // 辅助核算项目编号
  type?: number // 辅助核算类型
  name?: string // 辅助核算项目名称
}

/** FMS 凭证分录 */
export interface VoucherEntry {
  id?: number // 分录编号
  digest: string // 摘要内容
  subjectId: number // 科目编号
  quantity?: number // 数量
  unitPrice?: number // 单价
  debitAmount?: number // 借方金额
  creditAmount?: number // 贷方金额
  auxiliaries: VoucherAuxiliaryItem[] // 辅助核算项目数组
  subjectCode?: string // 科目编码
  subjectName?: string // 科目名称
  sort?: number // 显示顺序
}

/** FMS 凭证 */
export interface Voucher {
  id: number // 凭证编号
  accountSetId: number // 账套编号
  voucherWordId: number // 凭证字编号
  voucherNumber: number // 凭证号
  voucherTime: number // 凭证日期时间戳
  attachmentUrls: string[] // 附件地址数组
  entries: VoucherEntry[] // 凭证分录数组
  voucherWordName?: string // 凭证字
  attachmentCount: number // 附单据张数
  debitAmount: number // 借方金额
  creditAmount: number // 贷方金额
  total: number // 合计金额
  status: number // 审核状态
  closingGenerated: boolean // 是否为结账生成凭证
  creatorUserId?: number // 制单人后台用户编号
  creatorUserName?: string // 制单人名称
  reviewerUserId?: number // 审核人后台用户编号
  reviewerUserName?: string // 审核人名称
  createTime?: string // 创建时间
}

/** FMS 凭证保存参数 */
export interface VoucherSaveReq {
  id?: number // 凭证编号
  accountSetId: number // 账套编号
  voucherWordId: number // 凭证字编号
  voucherNumber: number // 凭证号
  voucherTime: number // 凭证日期时间戳
  attachmentCount: number // 附单据张数
  entries: VoucherEntry[] // 凭证分录数组
}

/** FMS 凭证附件修改参数 */
export interface VoucherAttachmentUpdateReq {
  id: number // 凭证编号
  accountSetId: number // 账套编号
  attachmentUrls: string[] // 附件地址数组
}

/** 查询凭证详情 */
export function getVoucher(accountSetId: number, id: number) {
  return http.get<Voucher>('/fms/voucher/get', { accountSetId, id })
}

/** 查询下一凭证号，voucherTime 格式为 YYYY-MM-DD HH:mm:ss */
export function getNextVoucherNumber(accountSetId: number, voucherWordId: number, voucherTime: string) {
  return http.get<number>('/fms/voucher/next-number', { accountSetId, voucherWordId, voucherTime })
}

/** 新增凭证 */
export function createVoucher(data: VoucherSaveReq) {
  return http.post<number>('/fms/voucher/create', data)
}

/** 修改凭证 */
export function updateVoucher(data: VoucherSaveReq) {
  return http.put<boolean>('/fms/voucher/update', data)
}

/** 修改凭证附件 */
export function updateVoucherAttachments(data: VoucherAttachmentUpdateReq) {
  return http.put<boolean>('/fms/voucher/update-attachments', data)
}

/** FMS 凭证审核参数 */
export interface VoucherReviewReq {
  accountSetId: number // 账套编号
  ids: number[] // 凭证编号数组
  status: number // 审核状态：0 待审核、1 已审核
}

/** FMS 凭证汇总查询参数 */
export interface VoucherStatisticsReq {
  accountSetId: number // 账套编号
  startMonth: string // 开始会计期间，格式为 YYYY-MM
  endMonth: string // 结束会计期间，格式为 YYYY-MM
  voucherWordId?: number // 凭证字编号
  minVoucherNumber?: number // 最小凭证号
  maxVoucherNumber?: number // 最大凭证号
  minLevel?: number // 最小科目级次
  maxLevel?: number // 最大科目级次
}

/** FMS 凭证汇总 */
export interface VoucherStatistics {
  subjectId: number // 科目编号
  subjectCode: string // 科目编码
  subjectName: string // 科目名称
  level: number // 科目级次
  debitAmount: number // 借方金额
  creditAmount: number // 贷方金额
}

/** 查询凭证分页 */
export function getVoucherPage(params: PageParam & Record<string, any>) {
  return http.get<PageResult<Voucher>>('/fms/voucher/page', params)
}

/** 查询凭证汇总列表 */
export function getVoucherStatisticsList(params: VoucherStatisticsReq) {
  return http.get<VoucherStatistics[]>('/fms/voucher/statistics/list', params)
}

/** 修改凭证审核状态（批量） */
export function updateVoucherReviewStatus(data: VoucherReviewReq) {
  return http.put<boolean>('/fms/voucher/update-review-status', data)
}

/** 审核凭证 */
export function reviewVoucher(accountSetId: number, ids: number[]) {
  return updateVoucherReviewStatus({ accountSetId, ids, status: 1 })
}

/** 反审核凭证 */
export function cancelReviewVoucher(accountSetId: number, ids: number[]) {
  return updateVoucherReviewStatus({ accountSetId, ids, status: 0 })
}

/** 删除凭证（后端为批量接口，ids 逗号拼接） */
export function deleteVoucherList(accountSetId: number, ids: number[]) {
  return http.delete<boolean>('/fms/voucher/delete-list', { accountSetId, ids: ids.join(',') })
}

/** 删除单张凭证 */
export function deleteVoucher(accountSetId: number, id: number) {
  return deleteVoucherList(accountSetId, [id])
}

/** FMS 凭证整理参数 */
export interface VoucherTidyReq {
  accountSetId: number // 账套编号
  month: string // 整理月份，格式为 YYYY-MM
  voucherWordId?: number // 凭证字编号，为空时整理全部凭证字
  startNumber: number // 起始编号
  type: number // 整理方式：1 顺次补齐断号、2 按凭证日期重排
}

/** FMS 凭证移动参数 */
export interface VoucherMoveReq {
  accountSetId: number // 账套编号
  month: string // 凭证月份，格式为 YYYY-MM
  voucherWordId: number // 凭证字编号
  sourceNumber: number // 原凭证号
  targetNumber: number // 移动到的凭证号
}

/** 整理凭证 */
export function tidyVoucher(data: VoucherTidyReq) {
  return http.put<boolean>('/fms/voucher/tidy', data)
}

/** 移动凭证 */
export function moveVoucher(data: VoucherMoveReq) {
  return http.put<boolean>('/fms/voucher/move', data)
}
