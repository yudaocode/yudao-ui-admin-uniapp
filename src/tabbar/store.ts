import type { CustomTabBarItem, CustomTabBarItemBadge } from './types'
import { reactive } from 'vue'

import { isNeedLoginMode } from '@/router/config'
import { FG_LOG_ENABLE, judgeIsExcludePath } from '@/router/interceptor'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { tabbarList as _tabbarList, customTabbarEnable, selectedTabbarStrategy, TABBAR_STRATEGY_MAP } from './config'

// TODO 1/2: 中间的鼓包tabbarItem的开关
const BULGE_ENABLE = false

/** tabbarList 里面的 path 从 pages.config.ts 得到 */
const tabbarList = reactive<CustomTabBarItem[]>(_tabbarList.map(item => ({
  ...item,
  pagePath: item.pagePath.startsWith('/') ? item.pagePath : `/${item.pagePath}`,
})))

if (customTabbarEnable && BULGE_ENABLE) {
  if (tabbarList.length % 2) {
    console.error('有鼓包时 tabbar 数量必须是偶数，否则样式很奇怪！！')
  }
  tabbarList.splice(tabbarList.length / 2, 0, {
    isBulge: true,
  } as CustomTabBarItem)
}

export function isPageTabbar(path: string) {
  if (selectedTabbarStrategy === TABBAR_STRATEGY_MAP.NO_TABBAR) {
    return false
  }
  const _path = normalizeRoutePath(path)
  // '/' 当做首页
  if (_path === '/') {
    return true
  }
  return tabbarList.some(item => item.pagePath === _path)
}

export function normalizeRoutePath(path?: string) {
  if (!path) {
    return ''
  }
  const _path = path.split('?')[0]
  return _path.startsWith('/') ? _path : `/${_path}`
}

function getCurrentPagePath() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  return normalizeRoutePath(currentPage?.route)
}

function findTabbarIndexByPath(path?: string) {
  const normalizedPath = normalizeRoutePath(path)
  if (normalizedPath === '/') {
    return 0
  }
  return tabbarList.findIndex(item => item.pagePath === normalizedPath)
}

export function isTabbarItemVisible(itemOrIndex?: CustomTabBarItem | number) {
  const item = typeof itemOrIndex === 'number' ? tabbarList[itemOrIndex] : itemOrIndex
  if (!item) {
    return false
  }
  if (!item.roles?.length) {
    return true
  }
  const userStore = useUserStore()
  const userRoles = new Set(userStore.roles)
  return item.roles.some(role => userRoles.has(role))
}

/**
 * 自定义 tabbar 的状态管理，原生 tabbar 无需关注本文件
 * tabbar 状态，增加 storageSync 保证刷新浏览器时在正确的 tabbar 页面
 * 使用reactive简单状态，而不是 pinia 全局状态
 */
const tabbarStore = reactive({
  curIdx: uni.getStorageSync('app-tabbar-index') || 0,
  prevIdx: uni.getStorageSync('app-tabbar-index') || 0,
  setCurIdx(idx: number) {
    const item = tabbarList[idx]
    if (!item) {
      return
    }
    if (!isTabbarItemVisible(item)) {
      return
    }
    const tokenStore = useTokenStore().updateNowTime()
    // 已登录 或 (url 需要登录 && 在白名单 || 不需要登录 && 不在黑名单) （关于 白名单|黑名单 逻辑： src/router/interceptor.ts）
    if (tokenStore.hasLogin || (isNeedLoginMode && judgeIsExcludePath(item.pagePath)) || (!isNeedLoginMode && !judgeIsExcludePath(item.pagePath))) {
      this.curIdx = idx
      uni.setStorageSync('app-tabbar-index', idx)
    }
  },
  setTabbarItemBadge(idx: number, badge: CustomTabBarItemBadge) {
    if (tabbarList[idx]) {
      tabbarList[idx].badge = badge
    }
  },
  setAutoCurIdx(path: string) {
    const index = findTabbarIndexByPath(path)
    FG_LOG_ENABLE && console.log('index:', index, path)
    // console.log('tabbarList:', tabbarList)
    if (index >= 0) {
      if (!isTabbarItemVisible(index)) {
        return
      }
      this.setCurIdx(index)
      return
    }

    if (this.curIdx < 0 || this.curIdx >= tabbarList.length || !isTabbarItemVisible(this.curIdx)) {
      const firstVisibleIndex = tabbarList.findIndex(item => isTabbarItemVisible(item))
      if (firstVisibleIndex >= 0) {
        this.setCurIdx(firstVisibleIndex)
      }
    }
  },
  syncCurIdxByCurrentPage() {
    const currentPath = getCurrentPagePath()
    if (currentPath) {
      this.setAutoCurIdx(currentPath)
    }
  },
  syncCurIdxByCurrentPageAsync() {
    setTimeout(() => {
      this.syncCurIdxByCurrentPage()
    }, 0)
  },
  isCurrentRouteTabbarItem(index: number) {
    const item = tabbarList[index]
    if (!item) {
      return false
    }
    if (!isTabbarItemVisible(item)) {
      return false
    }
    return findTabbarIndexByPath(getCurrentPagePath()) === index
  },
  isTabbarItemVisible,
  restorePrevIdx() {
    if (this.prevIdx === this.curIdx)
      return
    this.setCurIdx(this.prevIdx)
    this.prevIdx = uni.getStorageSync('app-tabbar-index') || 0
  },
})

export { tabbarList, tabbarStore }
