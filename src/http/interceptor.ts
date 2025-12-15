/* eslint-disable brace-style */ // 原因：unibest 官方维护的代码，尽量不要大概，避免难以合并
import type { CustomRequestOptions } from '@/http/types'
import { useTokenStore, useUserStore } from '@/store'
import { getEnvBaseUrl } from '@/utils'
import { stringifyQuery } from './tools/queryString'

// 请求基准地址
const baseUrl = getEnvBaseUrl()
const tenantEnable = import.meta.env.VITE_APP_TENANT_ENABLE

const whiteList: string[] = [
  '/login',
  '/refresh-token',
  '/system/tenant/get-id-by-name',
] // 白名单列表，不需要传递 token 字段

// 拦截器配置
const httpInterceptor = {
  // 拦截前触发
  invoke(options: CustomRequestOptions) {
    // 接口请求支持通过 query 参数配置 queryString
    if (options.query) {
      const queryStr = stringifyQuery(options.query)
      if (options.url.includes('?')) {
        options.url += `&${queryStr}`
      }
      else {
        options.url += `?${queryStr}`
      }
    }
    // 非 http 开头需拼接地址
    if (!options.url.startsWith('http')) {
      // #ifdef H5
      if (JSON.parse(import.meta.env.VITE_APP_PROXY_ENABLE)) {
        // 自动拼接代理前缀
        options.url = import.meta.env.VITE_APP_PROXY_PREFIX + options.url
      }
      else {
        options.url = baseUrl + options.url
      }
      // #endif
      // 非H5正常拼接
      // #ifndef H5
      options.url = baseUrl + options.url
      // #endif
      // TIPS: 如果需要对接多个后端服务，也可以在这里处理，拼接成所需要的地址
    }
    // 1. 请求超时
    options.timeout = 60000 // 60s
    // 2. （可选）添加小程序端请求头标识
    options.header = {
      ...options.header,
    }
    // 3. 添加 token 请求头标识
    const tokenStore = useTokenStore()
    const token = tokenStore.validToken
    let isToken = (options!.header || {}).isToken === false
    whiteList.some((v) => {
      if (options.url && options.url.includes(v)) {
        return (isToken = false)
      }
    })
    if (!isToken && token) {
      options.header.Authorization = `Bearer ${token}`
    }

    // 4. 添加租户标识
    if (tenantEnable && tenantEnable === 'true') {
      const tenantId = useUserStore().tenantId
      if (tenantId) {
        options.header['tenant-id'] = tenantId
      }
    }
    return options
  },
}

export const requestInterceptor = {
  install() {
    // 拦截 request 请求
    uni.addInterceptor('request', httpInterceptor)
    // 拦截 uploadFile 文件上传
    uni.addInterceptor('uploadFile', httpInterceptor)
  },
}
