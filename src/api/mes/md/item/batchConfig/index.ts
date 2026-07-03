import { http } from '@/http/http'

/** MES 物料批次属性配置（查询返回） */
export interface MdItemBatchConfig {
  id?: number // 编号
  itemId: number // 物料编号
  produceDateFlag: boolean | null // 生产日期
  expireDateFlag: boolean | null // 有效期
  receiptDateFlag: boolean | null // 入库日期
  vendorFlag: boolean | null // 供应商
  clientFlag: boolean | null // 客户
  salesOrderCodeFlag: boolean | null // 销售订单编号
  purchaseOrderCodeFlag: boolean | null // 采购订单编号
  workorderFlag: boolean | null // 生产工单
  taskFlag: boolean | null // 生产任务
  workstationFlag: boolean | null // 工作站
  toolFlag: boolean | null // 工具
  moldFlag: boolean | null // 模具
  lotNumberFlag: boolean | null // 生产批号
  qualityStatusFlag: boolean | null // 质量状态
  createTime?: Date // 创建时间
}

/** 根据物料编号获取批次属性配置（可能返回 null） */
export function getBatchConfigByItemId(itemId: number) {
  return http.get<MdItemBatchConfig | null>(`/mes/md/item-batch-config/get-by-item-id?itemId=${itemId}`)
}

/** 保存批次属性配置（新增或更新，返回配置 ID） */
export function saveBatchConfig(data: MdItemBatchConfig) {
  return http.post<number>(`/mes/md/item-batch-config/save`, data)
}
