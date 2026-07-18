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

const OPENABLE_URL_PROTOCOLS = new Set(['http:', 'https:', 'blob:']) // 服务端外链允许协议

/** 解析允许打开的服务端 URL */
function resolveOpenableUrl(url?: string | null) {
  const value = url?.trim()
  if (!value) {
    return
  }
  if (value.startsWith('//')) {
    return `https:${value}`
  }
  const protocol = value.match(/^([a-z][a-z\d+.-]*:)/i)?.[1].toLowerCase()
  if (protocol) {
    return OPENABLE_URL_PROTOCOLS.has(protocol) ? value : undefined
  }
  // #ifdef H5
  try {
    const resolved = new URL(value, window.location.origin)
    return OPENABLE_URL_PROTOCOLS.has(resolved.protocol) ? resolved.toString() : undefined
  } catch {
    return
  }
  // #endif
}

/** 判断服务端 URL 是否允许打开 */
export function isOpenableUrl(url?: string | null) {
  return !!resolveOpenableUrl(url)
}

/** 打开外部链接：H5 新窗口 / App 系统浏览器 / 小程序复制链接兜底 */
export function openUrl(url?: string) {
  if (!url) {
    return
  }
  // #ifdef H5
  window.open(url, '_blank', 'noopener,noreferrer')
  // #endif
  // #ifdef APP-PLUS
  plus.runtime.openURL(url)
  // #endif
  // #ifndef H5 || APP-PLUS
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' }),
  })
  // #endif
}

/** 安全打开服务端提供的外部链接 */
export function openSafeUrl(url?: string | null) {
  const resolved = resolveOpenableUrl(url)
  if (resolved) {
    openUrl(resolved)
  }
}

/**
 * 获取路由/路径的第一层（根段），兼容有无前导斜杠
 * 例：'/pages-crm/contract/detail' -> 'pages-crm'；'pages-bpm/x/y' -> 'pages-bpm'
 * 本项目中根段即分包名，可用于判断两个页面是否同分包
 * @param path 路由或路径字符串
 * @returns 第一层路径段，空值兜底为空串
 */
export function getRouteRootSegment(path?: string): string {
  return (path || '').replace(/^\//, '').split('/')[0]
}

/**
 * 判断两个路由/路径是否同分包（比对第一层根段）
 * 任一方取不到分包名（空串）时返回 false
 * @param pathA 路由或路径
 * @param pathB 路由或路径
 * @returns 两者同分包则为 true
 */
export function isSamePackage(pathA?: string, pathB?: string): boolean {
  const rootA = getRouteRootSegment(pathA)
  return !!rootA && rootA === getRouteRootSegment(pathB)
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
