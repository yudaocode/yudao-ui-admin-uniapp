import type { PageMetaDatum, SubPackages } from '@uni-helper/vite-plugin-uni-pages'
import { isMpWeixin } from '@uni-helper/uni-env'
import { pages, subPackages } from '@/pages.json'
import { isPageTabbar } from '@/tabbar/store'

export type PageInstance = Page.PageInstance<AnyObject, object> & { $page: Page.PageInstance<AnyObject, object> & { fullPath: string } }

export function getLastPage() {
  // getCurrentPages() 至少有1个元素，所以不再额外判断
  // const lastPage = getCurrentPages().at(-1)
  // 上面那个在低版本安卓中打包会报错，所以改用下面这个【虽然我加了 src/interceptions/prototype.ts，但依然报错】
  const pages = getCurrentPages()
  return pages[pages.length - 1] as PageInstance
}

/**
 * 获取当前页面路由的 path 路径和 redirectPath 路径
 * path 如 '/pages/login/login'
 * redirectPath 如 '/pages/demo/base/route-interceptor'
 */
export function currRoute() {
  const lastPage = getLastPage() as PageInstance
  if (!lastPage) {
    return {
      path: '',
      query: {},
    }
  }
  const currRoute = lastPage.$page
  // console.log('lastPage.$page:', currRoute)
  // console.log('lastPage.$page.fullpath:', currRoute.fullPath)
  // console.log('lastPage.$page.options:', currRoute.options)
  // console.log('lastPage.options:', (lastPage as any).options)
  // 经过多端测试，只有 fullPath 靠谱，其他都不靠谱
  const { fullPath } = currRoute
  // console.log(fullPath)
  // eg: /pages/login/login?redirect=%2Fpages%2Fdemo%2Fbase%2Froute-interceptor (小程序)
  // eg: /pages/login/login?redirect=%2Fpages%2Froute-interceptor%2Findex%3Fname%3Dfeige%26age%3D30(h5)
  return parseUrlToObj(fullPath)
}

export function ensureDecodeURIComponent(url: string) {
  if (url.startsWith('%')) {
    return ensureDecodeURIComponent(decodeURIComponent(url))
  }
  return url
}

/**
 * 解析 url 得到 path 和 query
 * 比如输入url: /pages/login/login?redirect=%2Fpages%2Fdemo%2Fbase%2Froute-interceptor
 * 输出: {path: /pages/login/login, query: {redirect: /pages/demo/base/route-interceptor}}
 */
export function parseUrlToObj(url: string) {
  const [path, queryStr] = url.split('?')
  // console.log(path, queryStr)

  if (!queryStr) {
    return {
      path,
      query: {},
    }
  }
  const query: Record<string, string> = {}
  queryStr.split('&').forEach((item) => {
    const [key, value] = item.split('=')
    // console.log(key, value)
    query[key] = ensureDecodeURIComponent(value) // 这里需要统一 decodeURIComponent 一下，可以兼容h5和微信y
  })
  return { path, query }
}
/**
 * 得到所有的需要登录的 pages，包括主包和分包的
 * 这里设计得通用一点，可以传递 key 作为判断依据，默认是 excludeLoginPath, 与 route-block 配对使用
 * 如果没有传 key，则表示所有的 pages，如果传递了 key, 则表示通过 key 过滤
 */
export function getAllPages(key?: string) {
  // 这里处理主包
  const mainPages = (pages as PageMetaDatum[])
    .filter(page => !key || page[key])
    .map(page => ({
      ...page,
      path: `/${page.path}`,
    }))

  // 这里处理分包
  const subPages: PageMetaDatum[] = []
  ;(subPackages as SubPackages).forEach((subPageObj) => {
    // console.log(subPageObj)
    const { root } = subPageObj

    subPageObj.pages
      .filter(page => !key || page[key])
      .forEach((page) => {
        subPages.push({
          ...page,
          path: `/${root}/${page.path}`,
        })
      })
  })
  const result = [...mainPages, ...subPages]
  // console.log(`getAllPages by ${key} result: `, result)
  return result
}

export function getCurrentPageI18nKey() {
  const routeObj = currRoute()
  const currPage = (pages as PageMetaDatum[]).find(page => `/${page.path}` === routeObj.path)
  if (!currPage) {
    console.warn('路由不正确')
    return ''
  }
  console.log(currPage)
  console.log(currPage.style.navigationBarTitleText)
  return currPage.style?.navigationBarTitleText || ''
}

/**
 * 根据微信小程序当前环境，判断应该获取的 baseUrl
 */
export function getEnvBaseUrl() {
  // 默认请求地址。微信小程序如果没有配置专用地址，也会回退到这个地址。
  let baseUrl = import.meta.env.VITE_SERVER_BASEURL

  // 微信小程序端环境区分
  if (isMpWeixin) {
    const {
      miniProgram: { envVersion },
    } = uni.getAccountInfoSync()
    const weixinBaseUrlMap: Record<string, string | undefined> = {
      develop: import.meta.env.VITE_SERVER_BASEURL__WEIXIN_DEVELOP,
      trial: import.meta.env.VITE_SERVER_BASEURL__WEIXIN_TRIAL,
      release: import.meta.env.VITE_SERVER_BASEURL__WEIXIN_RELEASE,
    }

    baseUrl = weixinBaseUrlMap[envVersion] || baseUrl
  }

  return baseUrl
}

/**
 * 根据环境变量，获取基础路径的根路径，比如 http://localhost:48080
 *
 * add by 芋艿：用户类似 websocket 这种需要根路径的场景
 *
 * @return 根路径
 */
export function getEnvBaseUrlRoot() {
  const baseUrl = getEnvBaseUrl()
  // 提取根路径
  const urlObj = new URL(baseUrl)
  return urlObj.origin
}

/**
 * 是否是双token模式
 */
export const isDoubleTokenMode = import.meta.env.VITE_AUTH_MODE === 'double'

/**
 * 首页路径，通过 page.json 里面的 type 为 home 的页面获取，如果没有，则默认是第一个页面
 * 通常为 /pages/index/index
 */
export const HOME_PAGE = `/${(pages as PageMetaDatum[]).find(page => page.type === 'home')?.path || (pages as PageMetaDatum[])[0].path}`

/**
 * 登录成功后跳转
 *
 * @author 芋艿
 * @param redirectUrl 重定向地址，为空则跳转到默认首页（HOME_PAGE）
 */
export function redirectAfterLogin(redirectUrl?: string) {
  let path = redirectUrl || HOME_PAGE
  if (!path.startsWith('/')) {
    path = `/${path}`
  }
  const { path: _path, query } = parseUrlToObj(path)
  if (isPageTabbar(_path)) {
    uni.switchTab({ url: path })
  } else {
    // 如果 query 有值则通过reLaunch方式跳转过来所以不能用back
    if (Object.keys(query).length > 0) {
      uni.reLaunch({ url: path })
    } else {
      uni.navigateBack()
    }
  }
}

/**
 * 增强的返回方法
 * 1. 如果存在上一页，则返回上一页
 * 2. 如果不存在上一页，则跳转到传入的 fallbackUrl 地址
 * 3. 如果 fallbackUrl 也不存在，则跳转到首页
 *
 * @author 芋艿
 * @param fallbackUrl 备选跳转地址，当不存在上一页时使用
 */
export function navigateBackPlus(fallbackUrl?: string) {
  const pages = getCurrentPages()
  // 情况一：如果存在上一页（页面栈长度大于 1），则直接返回
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  // 情况二 + 三：不存在上一页，尝试跳转到传入的 fallbackUrl
  let targetUrl = fallbackUrl || HOME_PAGE
  // 确保路径以 / 开头
  if (!targetUrl.startsWith('/')) {
    targetUrl = `/${targetUrl}`
  }
  // 解析路径，判断是否是 tabbar 页面
  const { path } = parseUrlToObj(targetUrl)
  if (isPageTabbar(path)) {
    uni.switchTab({ url: targetUrl })
  } else {
    uni.reLaunch({ url: targetUrl })
  }
}

/** 延迟执行回调，给成功提示等交互留出展示时间 */
export function delay(callback: () => void, ms = 500) {
  setTimeout(callback, ms)
}

/** 获取 wd-navbar 导航栏高度 */
export function getNavbarHeight() {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 0
  // #ifdef MP-WEIXIN
  // 小程序：根据胶囊按钮位置计算导航栏高度，确保内容与胶囊垂直居中
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
  // 导航栏高度 = (胶囊顶部到状态栏底部的距离) * 2 + 胶囊高度
  const navBarHeight = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height
  return statusBarHeight + navBarHeight
  // #endif
  // #ifndef MP-WEIXIN
  // H5/App：状态栏高度 + 导航栏高度（44px）
  return statusBarHeight + 44
  // #endif
}

/** 生成顶部弹窗样式，使弹窗从 navbar 下方开始，避免白色空洞 */
export function getTopPopupStyle() {
  const top = getNavbarHeight()
  return `top: ${top}px; max-height: calc(100% - ${top}px);`
}

/** 生成顶部弹窗遮罩样式，使遮罩只覆盖 navbar 下方内容 */
export function getTopPopupModalStyle() {
  return `top: ${getNavbarHeight()}px;`
}

/** 字符串数组逐项去空白并过滤空项 */
export function trimArray(list: string[]): string[] {
  return list.map(item => item.trim()).filter(Boolean)
}

/** 归一化字符串里的转义换行 */
export function normalizeEscapedNewlines(text: string): string {
  return text.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
}

/** 换行文本转字符串数组（逐项去空白、过滤空项），用于多值表单字段 */
export function linesToArray(text: string): string[] {
  return trimArray(text.split('\n'))
}

/** 字符串数组转换行文本，用于多值表单字段 */
export function arrayToLines(list?: string[]): string {
  return (list || []).join('\n')
}
