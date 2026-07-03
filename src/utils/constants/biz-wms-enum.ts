/** WMS 单据状态 */
export const WmsOrderStatusEnum = {
  PREPARE: 0, // 草稿
  FINISHED: 4, // 已完成
  CANCELED: 5, // 已作废
} as const

/** WMS 单据类型 */
export const WmsOrderTypeEnum = {
  RECEIPT: 1, // 入库
  SHIPMENT: 2, // 出库
  MOVEMENT: 3, // 移库
  CHECK: 4, // 盘库
} as const

/** 可修改的 WMS 单据状态 */
export const WmsOrderUpdateStatusList: number[] = [WmsOrderStatusEnum.PREPARE]

/** 可删除的 WMS 单据状态 */
export const WmsOrderDeleteStatusList: number[] = [
  WmsOrderStatusEnum.PREPARE,
  WmsOrderStatusEnum.CANCELED,
]

/** WMS 往来企业类型 */
export const WmsMerchantTypeEnum = {
  CUSTOMER: 1, // 客户
  SUPPLIER: 2, // 供应商
  CUSTOMER_SUPPLIER: 3, // 客户/供应商
} as const

/** 供应商类型的 WMS 往来企业 */
export const WmsSupplierMerchantTypeList = [
  WmsMerchantTypeEnum.SUPPLIER,
  WmsMerchantTypeEnum.CUSTOMER_SUPPLIER,
]

/** 客户类型的 WMS 往来企业 */
export const WmsCustomerMerchantTypeList = [
  WmsMerchantTypeEnum.CUSTOMER,
  WmsMerchantTypeEnum.CUSTOMER_SUPPLIER,
]
