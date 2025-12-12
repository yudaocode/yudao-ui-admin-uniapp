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

export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<IUserInfoRes>({ ...userInfoState })
    const tenantId = ref<number | null>(null) // 租户编号
    const roles = ref<string[]>([]) // 角色标识列表
    const permissions = ref<string[]>([]) // 权限标识列表
    const favoriteMenus = ref<string[]>([]) // 常用菜单 key 列表

    /** 设置用户信息 */
    const setUserInfo = (val: AuthPermissionInfo) => {
      // console.log('设置用户信息', val)
      // 若头像为空 则使用默认头像
      if (!val.user) {
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
      roles.value = []
      permissions.value = []
      uni.removeStorageSync('user')
    }

    /** 设置租户编号 */
    const setTenantId = (id: number) => {
      tenantId.value = id
    }

    /** 设置常用菜单 */
    const setFavoriteMenus = (keys: string[]) => {
      favoriteMenus.value = keys
    }

    /** 获取用户信息 */
    const fetchUserInfo = async () => {
      const res = await getAuthPermissionInfo()
      setUserInfo(res)
      return res
    }

    return {
      userInfo,
      tenantId,
      roles,
      permissions,
      favoriteMenus,
      clearUserInfo,
      fetchUserInfo,
      setUserInfo,
      setUserAvatar,
      setTenantId,
      setFavoriteMenus,
    }
  },
  {
    persist: true,
  },
)
