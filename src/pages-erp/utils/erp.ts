import { getSimpleUserList } from '@/api/system/user'
import { getAccountSimpleList } from '@/api/erp/finance/account'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getSupplierSimpleList } from '@/api/erp/purchase/supplier'
import { getCustomerSimpleList } from '@/api/erp/sale/customer'
import { getStockByProductAndWarehouse, getStockCount } from '@/api/erp/stock/stock'
import { getWarehouseSimpleList } from '@/api/erp/stock/warehouse'
import { isFiniteNumberValue, toNumber } from '@/utils/format'
import { isEmptyValue } from '@/utils/is'
import {
  calculatePercentPrice,
  calculateTaxPrice,
  multiplyPrice,
  roundCount,
  roundPrice,
  sumCount,
  sumPrice,
} from './format'

type ErpDetailOptionKey = 'account' | 'customer' | 'product' | 'supplier' | 'user' | 'warehouse'
type ErpOptionsMap = Partial<Record<ErpDetailOptionKey, Array<Record<string, any>>>>

/** 加载详情补全选项 */
async function loadErpDetailOptions(loader: () => Promise<Record<string, any>[]>) {
  try {
    return await loader() || []
  } catch {
    // 单个 simple-list 失败不影响详情主体展示
    return []
  }
}

/** 构建详情补全选项 */
async function buildErpDetailOptionsMap(): Promise<ErpOptionsMap> {
  const [customers, suppliers, accounts, users, warehouses, products] = await Promise.all([
    loadErpDetailOptions(getCustomerSimpleList),
    loadErpDetailOptions(getSupplierSimpleList),
    loadErpDetailOptions(getAccountSimpleList),
    loadErpDetailOptions(getSimpleUserList),
    loadErpDetailOptions(getWarehouseSimpleList),
    loadErpDetailOptions(getProductSimpleList),
  ])
  return {
    customer: customers,
    supplier: suppliers,
    account: accounts,
    user: users,
    warehouse: warehouses,
    product: products,
  }
}

/** 获取 ERP 选项展示名称 */
export function getErpOptionLabel(options: Record<string, any>[], id?: unknown) {
  if (isEmptyValue(id)) {
    return ''
  }
  const option = options.find(item => String(item.id) === String(id))
  return option?.name || option?.nickname || option?.username || option?.label || option?.no || option?.id || String(id)
}

/** 获取 ERP 商品选项 */
function getErpProductOption(optionsMap: ErpOptionsMap, productId?: unknown) {
  if (isEmptyValue(productId)) {
    return undefined
  }
  return optionsMap.product?.find(item => String(item.id) === String(productId))
}

/** 构建 ERP 单据详情 */
export async function buildErpDocumentDetail(data: Record<string, any>, moduleKey: string) {
  const detail = data || {}

  // 详情接口可能只返回编号，移动端按当前选项补齐展示名
  const optionsMap = await buildErpDetailOptionsMap()
  const productOption = getErpProductOption(optionsMap, detail.productId)
  const result = {
    ...detail,
    customerName: detail.customerName || getErpOptionLabel(optionsMap.customer || [], detail.customerId),
    supplierName: detail.supplierName || getErpOptionLabel(optionsMap.supplier || [], detail.supplierId),
    accountName: detail.accountName || getErpOptionLabel(optionsMap.account || [], detail.accountId),
    creatorName: detail.creatorName || getErpOptionLabel(optionsMap.user || [], detail.creator),
    saleUserName: detail.saleUserName || getErpOptionLabel(optionsMap.user || [], detail.saleUserId),
    financeUserName: detail.financeUserName || getErpOptionLabel(optionsMap.user || [], detail.financeUserId),
    productName: detail.productName || getErpOptionLabel(optionsMap.product || [], detail.productId),
    categoryName: detail.categoryName || productOption?.categoryName,
    unitName: detail.unitName || productOption?.unitName,
    warehouseName: detail.warehouseName || getErpOptionLabel(optionsMap.warehouse || [], detail.warehouseId),
    items: Array.isArray(detail.items)
      ? detail.items.map(item => ({
          ...item,
          warehouseName: item.warehouseName || getErpOptionLabel(optionsMap.warehouse || [], item.warehouseId),
          fromWarehouseName: item.fromWarehouseName || getErpOptionLabel(optionsMap.warehouse || [], item.fromWarehouseId),
          toWarehouseName: item.toWarehouseName || getErpOptionLabel(optionsMap.warehouse || [], item.toWarehouseId),
        }))
      : [],
  }

  // 老数据或部分详情接口可能缺汇总字段，只补缺失值，不覆盖后端已有值
  refreshErpDocumentAmount(result, moduleKey)
  return result
}

/** 刷新 ERP 单据金额 */
function refreshErpDocumentAmount(data: Record<string, any>, moduleKey?: string) {
  if (!Array.isArray(data.items)) {
    return
  }
  const items = data.items as Record<string, any>[]
  if (items.length === 0) {
    return
  }

  // 先补齐每条明细金额，后续主表汇总直接读取明细合计
  items.forEach(item => refreshErpDocumentItemAmount(item, moduleKey))

  // 财务单据和业务单据的汇总字段不同，按单据类型分别处理
  if (moduleKey === 'finance-payment' || moduleKey === 'finance-receipt') {
    refreshErpFinanceDocumentAmount(data, moduleKey)
    return
  }
  refreshErpBusinessDocumentAmount(data)
}

/** 刷新 ERP 单据明细金额 */
function refreshErpDocumentItemAmount(item: Record<string, any>, moduleKey?: string) {
  // 盘点单用「实盘库存 - 账面库存」补盈亏数量
  if (moduleKey === 'stock-check' && isFiniteNumberValue(item.stockCount) && isFiniteNumberValue(item.actualCount)) {
    item.count = roundCount(toNumber(item.actualCount) - toNumber(item.stockCount))
  }
  refreshErpItemAmount(item)
}

/** 刷新 ERP 财务单据金额 */
function refreshErpFinanceDocumentAmount(data: Record<string, any>, moduleKey: string) {
  // 付款单和收款单字段不同，但汇总规则一致
  const items = data.items as Record<string, any>[]
  const priceField = moduleKey === 'finance-payment' ? 'paymentPrice' : 'receiptPrice'
  const price = sumPrice(items, item => item[priceField])
  if (!isFiniteNumberValue(data.totalPrice)) {
    data.totalPrice = roundPrice(price)
  }
  if (!isFiniteNumberValue(data[priceField])) {
    data[priceField] = roundPrice(price - toNumber(data.discountPrice))
  }
}

/** 刷新 ERP 业务单据金额 */
function refreshErpBusinessDocumentAmount(data: Record<string, any>) {
  // 采购、销售、库存单据按数量、优惠、其它费用汇总主表
  const items = data.items as Record<string, any>[]
  if (!isFiniteNumberValue(data.totalCount)) {
    data.totalCount = roundCount(sumCount(items, item => item.count))
  }
  const totalPrice = sumPrice(items, item => item.totalPrice)
  const discountPrice = isFiniteNumberValue(data.discountPrice)
    ? toNumber(data.discountPrice)
    : calculatePercentPrice(totalPrice, data.discountPercent) ?? 0
  if (('discountPrice' in data || 'discountPercent' in data) && !isFiniteNumberValue(data.discountPrice)) {
    data.discountPrice = discountPrice
  }
  if (!isFiniteNumberValue(data.totalPrice)) {
    data.totalPrice = roundPrice(totalPrice - discountPrice + toNumber(data.otherPrice))
  }
}

/**
 * 按产品与仓库加载库存数量，写入 item.stockCount
 * @param item 明细对象
 * @param warehouseField 仓库 ID 字段名，默认 'warehouseId'（调拨编辑器传 'fromWarehouseId'）
 */
export async function loadErpItemStockCount(item: Record<string, any>, warehouseField = 'warehouseId') {
  if (!item.productId) {
    return
  }
  // 有仓库时查指定仓库库存，否则查商品全仓库存
  if (item[warehouseField]) {
    const stock = await getStockByProductAndWarehouse(Number(item.productId), Number(item[warehouseField]))
    item.stockCount = stock?.count || 0
    return
  }
  item.stockCount = await getStockCount(Number(item.productId))
}

/** 刷新单条明细金额（自动兼容含税明细） */
export function refreshErpItemAmount(item: Record<string, any>) {
  const hasCount = isFiniteNumberValue(item.count)
  const hasProductPrice = isFiniteNumberValue(item.productPrice)
  const hasPrice = isFiniteNumberValue(item.price)
  if (!hasCount || (!hasProductPrice && !hasPrice)) {
    return
  }

  const price = hasProductPrice ? item.productPrice : item.price
  const totalProductPrice = multiplyPrice(item.count, price)
  if (totalProductPrice === undefined) {
    return
  }
  // 采购/销售明细有税额字段，库存明细只有 totalPrice
  const hasTaxAmount = 'totalProductPrice' in item || 'taxPercent' in item || 'taxPrice' in item
  if (hasTaxAmount) {
    item.totalProductPrice = totalProductPrice
    item.taxPrice = calculateTaxPrice(item.totalProductPrice, item.taxPercent)
    item.totalPrice = roundPrice(item.totalProductPrice + item.taxPrice)
    return
  }
  item.totalPrice = totalProductPrice
}
