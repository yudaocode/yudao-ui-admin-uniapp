import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 流转卡工序记录 */
export interface ProCardProcess {
  id?: number // 编号
  cardId: number // 流转卡编号
  sort?: number // 序号
  processId?: number // 工序编号
  processCode?: string // 工序编码
  processName?: string // 工序名称
  inputTime?: Date // 进入工序时间
  outputTime?: Date // 出工序时间
  inputQuantity?: number // 投入数量
  outputQuantity?: number // 产出数量
  unqualifiedQuantity?: number // 不合格品数量
  workstationId?: number // 工位编号
  workstationCode?: string // 工位编码
  workstationName?: string // 工位名称
  userId?: number // 操作人编号
  nickname?: string // 操作人名称
  ipqcId?: number // 过程检验单编号
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询流转卡工序记录分页 */
export function getCardProcessPage(params: PageParam) {
  return http.get<PageResult<ProCardProcess>>('/mes/pro/card-process/page', params)
}

/** 查询流转卡工序记录详情 */
export function getCardProcess(id: number) {
  return http.get<ProCardProcess>(`/mes/pro/card-process/get?id=${id}`)
}

/** 新增流转卡工序记录 */
export function createCardProcess(data: ProCardProcess) {
  return http.post<number>('/mes/pro/card-process/create', data)
}

/** 修改流转卡工序记录 */
export function updateCardProcess(data: ProCardProcess) {
  return http.put<boolean>('/mes/pro/card-process/update', data)
}

/** 删除流转卡工序记录 */
export function deleteCardProcess(id: number) {
  return http.delete<boolean>(`/mes/pro/card-process/delete?id=${id}`)
}
