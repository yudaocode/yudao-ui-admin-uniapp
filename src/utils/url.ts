/**
 * 解析 URL 查询参数
 * @param url URL 字符串
 * @returns { path: 路径, query: 参数对象 }
 */
export function parseUrl(url: string): { path: string, query: Record<string, string> } {
  const [path, queryString] = url.split('?')
  const query: Record<string, string> = {}
  if (queryString) {
    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=')
      if (key) {
        query[key] = decodeURIComponent(value || '')
      }
    })
  }
  return { path, query }
}

/**
 * 设置 tabBar 页面跳转参数（通过 globalData 传递）
 * @param params 参数对象
 */
export function setTabParams(params: Record<string, string>) {
  const app = getApp()
  if (app) {
    app.globalData = app.globalData || {}
    app.globalData.tabParams = params
  }
}

/**
 * 获取并清除 tabBar 页面跳转参数
 * @returns 参数对象，如果没有则返回 undefined
 */
export function getAndClearTabParams(): Record<string, string> | undefined {
  const app = getApp()
  const tabParams = app?.globalData?.tabParams
  if (tabParams) {
    delete app.globalData.tabParams
  }
  return tabParams
}
