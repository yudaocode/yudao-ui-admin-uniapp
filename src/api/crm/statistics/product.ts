import { http } from '@/http/http'

/** 产品销售情况统计 */
export interface CrmStatisticsProductSalesResp {
  categoryId: number
  categoryName: string
  productId: number
  productName: string
  contractId: number
  contractNo: string
  contractName: string
  ownerUserId: number
  ownerUserName: string
  customerId: number
  customerName: string
  productPrice: number
  productCount: number
  productTotalPrice: number
}

/** 产品分类销售分析 */
export interface CrmStatisticsProductCategoryResp {
  categoryId: number
  categoryName: string
  contractCount: number
  productCount: number
  productTotalPrice: number
}

/** 获得产品销售情况统计 */
export function getProductSalesList(params: Record<string, any>) {
  return http.get<CrmStatisticsProductSalesResp[]>('/crm/statistics-product/get-product-sales-list', params)
}

/** 获得产品分类销售分析 */
export function getProductCategorySummary(params: Record<string, any>) {
  return http.get<CrmStatisticsProductCategoryResp[]>('/crm/statistics-product/get-product-category-summary', params)
}
