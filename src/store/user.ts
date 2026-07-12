import type { AuthPermissionInfo, IUserInfoRes } from '@/api/types/login'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  // getUserInfo,
  getAuthPermissionInfo,
} from '@/api/login'

// 初始化状态
const userInfoState: IUserInfoRes = {
  userId: -1,
  username: '',
  nickname: '',
  avatar: '/static/images/default-avatar.png', // TODO @芋艿：CDN 化
}

const MAX_RECENT_MENUS = 12 // 最近使用菜单最多保留数量

export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<IUserInfoRes>({ ...userInfoState })
    const tenantId = ref<number | null>(null) // 租户编号
    const visitTenantId = ref<number | null>(null) // 当前访问的租户编号
    const roles = ref<string[]>([]) // 角色标识列表
    const permissions = ref<string[]>([]) // 权限标识列表
    const favoriteMenus = ref<string[]>([]) // 常用菜单 key 列表
    const recentMenus = ref<string[]>([]) // 最近使用菜单 key 列表（按点击时间倒序）

    /** 设置用户信息 */
    const setUserInfo = (val: AuthPermissionInfo) => {
      // console.log('设置用户信息', val)
      // 若头像为空 则使用默认头像
      if (!val.user.avatar) {
        val.user.avatar = userInfoState.avatar
      }
      userInfo.value = val.user
      roles.value = val.roles
      permissions.value = val.permissions
    }

    const setUserAvatar = (avatar: string) => {
      userInfo.value.avatar = avatar
      // console.log('设置用户头像', avatar)
      // console.log('userInfo', userInfo.value)
    }

    /** 删除用户信息 */
    const clearUserInfo = () => {
      userInfo.value = { ...userInfoState }
      visitTenantId.value = null
      roles.value = []
      permissions.value = []
      uni.removeStorageSync('user')
    }

    /** 设置租户编号 */
    const setTenantId = (id: number) => {
      tenantId.value = id
    }

    /** 设置当前访问的租户编号 */
    const setVisitTenantId = (id: number | null) => {
      visitTenantId.value = id
    }

    /** 设置常用菜单 */
    const setFavoriteMenus = (keys: string[]) => {
      favoriteMenus.value = keys
    }

    /** 记录一次最近使用（去重后置顶，最多保留 MAX_RECENT_MENUS 个） */
    const addRecentMenu = (key: string) => {
      const list = recentMenus.value.filter(k => k !== key)
      list.unshift(key)
      recentMenus.value = list.slice(0, MAX_RECENT_MENUS)
    }

    /** 获取用户信息 */
    const fetchUserInfo = async () => {
      const res = await getAuthPermissionInfo()
      // 兼容：后端返回的用户 id 字段为 id
      res.user.userId = res.user.id
      setUserInfo(res)
      return res
    }

    return {
      userInfo,
      tenantId,
      visitTenantId,
      roles,
      permissions,
      favoriteMenus,
      recentMenus,
      clearUserInfo,
      fetchUserInfo,
      setUserInfo,
      setUserAvatar,
      setTenantId,
      setVisitTenantId,
      setFavoriteMenus,
      addRecentMenu,
    }
  },
  {
    persist: true,
  },
)
