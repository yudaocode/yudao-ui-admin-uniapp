import { onMounted, onUnmounted, ref } from 'vue'
import { parseUrlToObj } from '@/utils'

type RouteProps = object

/** 使用当前页面 query，兼容 H5 hash 直达和同页参数切换 */
export function useRouteQuery<T extends RouteProps>(props: T, pagePath: string) {
  const routeVersion = ref(0) // 路由刷新标记

  /** 判断当前 H5 路由是否仍是本页 */
  function isCurrentPageRoute() {
    // #ifdef H5
    return window.location.hash.split('?')[0] === `#${pagePath}`
    // #endif

    // #ifndef H5
    return true
    // #endif
  }

  /** 获取路由参数 */
  function getRouteQueryValue(key: keyof T) {
    void routeVersion.value
    const propValue = props[key] as number | string | undefined

    // #ifdef H5
    if (isCurrentPageRoute()) {
      const hashQuery = window.location.hash.split('?')[1] || ''
      const query = parseUrlToObj(hashQuery ? `/?${hashQuery}` : '').query
      return query[key as string]
    }
    return propValue
    // #endif

    if (propValue !== undefined) {
      return propValue
    }

    // #ifndef H5
    return undefined
    // #endif
  }

  /** 监听 H5 hash 参数变化 */
  function handleHashChange() {
    if (!isCurrentPageRoute())
      return
    routeVersion.value += 1
  }

  onMounted(() => {
    // #ifdef H5
    window.addEventListener('hashchange', handleHashChange)
    // #endif
  })

  onUnmounted(() => {
    // #ifdef H5
    window.removeEventListener('hashchange', handleHashChange)
    // #endif
  })

  return {
    routeVersion,
    getRouteQueryValue,
    isCurrentPageRoute,
  }
}
