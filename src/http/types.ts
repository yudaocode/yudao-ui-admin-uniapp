/**
 * 在 uniapp 的 RequestOptions 和 IUniUploadFileOptions 基础上，添加自定义参数
 */
export type CustomRequestOptions = UniApp.RequestOptions & {
  query?: Record<string, any>
  /** 出错时是否隐藏错误提示 */
  hideErrorToast?: boolean
  /** 是否返回原始数据 add by panda 25.12.10 */
  original?: boolean
} & IUniUploadFileOptions // 添加uni.uploadFile参数类型

// 通用响应格式（兼容 msg + message 字段）
export type IResponse<T = any> = {
  code: number
  data: T
  message: string
  [key: string]: any // 允许额外属性
} | {
  code: number
  data: T
  msg: string
  [key: string]: any // 允许额外属性
}

/** 分页参数 */
export interface PageParam {
  pageNo: number
  pageSize: number
  [key: string]: any // 允许额外属性
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[]
  total: number
}
/** 加载状态枚举 - 从 wot-design-uni 重新导出 */
export type { LoadMoreState } from 'wot-design-uni/components/wd-loadmore/types'
