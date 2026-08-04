import { getEmployeeBindStatus } from '@/api/hrm/portal/employee'

export const HRM_PORTAL_HOME_URL = '/pages-hrm/portal/home/index'
export const HRM_PORTAL_OPENING_GUIDE_URL = '/pages-hrm/portal/opening-guide/index'

/**
 * 校验当前账号是否已绑定员工档案
 *
 * 返回 true 时页面才继续加载业务数据；未绑定时跳转员工端开通引导页。
 * 绑定状态接口异常时继续加载页面，由具体业务接口按原有校验兜底。
 */
export async function checkHrmPortalAccess() {
  try {
    if (await getEmployeeBindStatus()) {
      return true
    }
    uni.redirectTo({ url: HRM_PORTAL_OPENING_GUIDE_URL })
    return false
  } catch {
    return true
  }
}

/**
 * 已绑定员工档案时，从开通引导页返回员工端工作台
 */
export async function redirectBoundEmployeeFromOpeningGuide() {
  try {
    if (!(await getEmployeeBindStatus())) {
      return false
    }
    uni.redirectTo({ url: HRM_PORTAL_HOME_URL })
    return true
  } catch {
    return false
  }
}
