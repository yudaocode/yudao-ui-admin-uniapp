/**
 * PC 端业务表单路径 -> 移动端路径映射
 * - key: PC 端路径 (formCustomCreatePath / formCustomViewPath)，已归一化（去掉 .vue 与多余的 /index）
 * - value: 移动端路径
 * 原因是：目前暂时没有 mobile 端的自定义表单字段，所以暂时需要硬编码映射关系
 *
 * 两种业务表单的接入方式（见 form-detail.vue）：
 * 1. 同分包（如 OA 请假，详情组件就在 pages-bpm 内）：直接静态 import 内嵌组件，参考 LeaveDetail。
 * 2. 跨分包（如 CRM 合同 / 回款，详情组件在 pages-crm 内）：微信小程序不支持跨分包 import 组件，
 *    因此不内嵌，改为通过 uni.navigateTo 跳转到对应移动端详情页（跨分包"路由跳转"是被支持的）。
 */
const PC_TO_MOBILE_PATH_MAP: Record<string, string> = {
  // OA 请假（同分包，内嵌）
  '/bpm/oa/leave/create': '/pages-bpm/oa/leave/create/index',
  '/bpm/oa/leave/detail': '/pages-bpm/oa/leave/detail/index',
  // CRM 合同审批（跨分包，仅详情，跳转）
  '/crm/contract/detail': '/pages-crm/contract/detail/index',
  // CRM 回款审批（跨分包，仅详情，跳转）
  '/crm/receivable/detail': '/pages-crm/receivable/detail/index',
  // OA 公文发文审批（跨分包，仅详情，跳转）
  '/oa/officialdoc/send/detail': '/pages-oa/officialdoc/send/detail/index',
  // OA 公文收文审批（跨分包，仅详情，跳转）
  '/oa/officialdoc/receive/detail': '/pages-oa/officialdoc/receive/detail/index',
}

/**
 * 归一化 PC 端路径：去首尾空白、去 .vue 后缀与多余的 /index，并补全前导斜杠
 * 兼容后端存储的不同格式，例如 /crm/contract/detail/index.vue、crm/contract/detail/index、/crm/contract/detail
 */
function normalizePcPath(pcPath: string): string {
  const p = pcPath.trim().replace(/\.vue$/, '').replace(/\/index$/, '')
  return p.startsWith('/') ? p : `/${p}`
}

/**
 * 根据 PC 端路径获取移动端的跳转路径
 * @param pcPath PC 端的表单路径
 * @returns 移动端的跳转路径，如果没有映射则返回 undefined
 */
export function getMobileFormCustomPath(pcPath: string | undefined): string | undefined {
  if (!pcPath) {
    return undefined
  }
  return PC_TO_MOBILE_PATH_MAP[normalizePcPath(pcPath)]
}

export * from './form-create'
