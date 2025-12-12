import { useUserStore } from '@/store/user'

/**
 * 权限控制 Hook
 * @description 提供基于角色和权限码的权限判断方法
 */
function useAccess() {
  const userStore = useUserStore()

  /**
   * 基于角色判断是否有权限
   * @description 通过用户的角色列表判断是否具有指定角色
   * @param roles 需要判断的角色列表
   * @returns 是否具有指定角色中的任意一个
   */
  function hasAccessByRoles(roles: string[]): boolean {
    const userRoleSet = new Set(userStore.roles)
    const intersection = roles.filter(item => userRoleSet.has(item))
    return intersection.length > 0
  }

  /**
   * 基于权限码判断是否有权限
   * @description 通过用户的权限码列表判断是否具有指定权限
   * @param codes 需要判断的权限码列表
   * @returns 是否具有指定权限码中的任意一个
   */
  function hasAccessByCodes(codes: string[]): boolean {
    const userCodesSet = new Set(userStore.permissions)
    const intersection = codes.filter(item => userCodesSet.has(item))
    return intersection.length > 0
  }

  return {
    hasAccessByCodes,
    hasAccessByRoles,
  }
}

export { useAccess }
export default useAccess
