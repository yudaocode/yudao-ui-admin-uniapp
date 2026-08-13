import type { AccountSet } from '@/api/fms/config/account-set'
import { defineStore } from 'pinia'
import { getAccountSetList } from '@/api/fms/config/account-set'
import { AccountUserLevel } from '@/api/fms/config/account-user'
import { getCurrentMonth } from '@/api/fms/closing/period'

const FMS_ACCOUNT_SET_CACHE_KEY = 'fmsAccountSet' // 当前账套缓存 Key，仅在 FMS 模块内部使用

/** FMS 当前账套上下文 */
export interface FmsAccountSetContext {
  id: number // 账套编号
  companyName: string // 公司名称
  level: number // 当前用户的成员权限级别
}

/** 读取缓存的当前账套 */
function getCachedAccountSet(): FmsAccountSetContext | undefined {
  const cached = uni.getStorageSync(FMS_ACCOUNT_SET_CACHE_KEY)
  return cached && cached.id ? cached : undefined
}

/** FMS 账套上下文 Store */
export const useFmsStore = defineStore('fms', () => {
  const accountSet = ref<FmsAccountSetContext | undefined>(getCachedAccountSet()) // 当前账套
  const currentMonth = ref<string>() // 当前会计期间，格式为 YYYY-MM
  const accountSetList = ref<AccountSet[]>([]) // 当前用户可访问的账套
  const accountSetListLoaded = ref(false) // 是否已加载账套列表

  /** 当前账套是否可写（成员为主管或会计） */
  const isAccountSetWritable = computed(() =>
    accountSetListLoaded.value
    && (accountSet.value?.level === AccountUserLevel.OWNER
      || accountSet.value?.level === AccountUserLevel.WRITE),
  )

  /**
   * 加载当前用户可访问的账套，并恢复一个可用账套
   *
   * 优先使用缓存账套，其次使用默认账套，最后使用第一条已初始化账套
   */
  async function loadAccountSetList(force = false): Promise<AccountSet[]> {
    if (accountSetListLoaded.value && !force) {
      return accountSetList.value
    }
    accountSetList.value = await getAccountSetList()
    accountSetListLoaded.value = true
    const accountSetItem
      = accountSetList.value.find(item => item.id === accountSet.value?.id && item.initialized)
        || accountSetList.value.find(item => item.defaultStatus && item.initialized)
        || accountSetList.value.find(item => item.initialized)
    if (accountSetItem?.id) {
      setAccountSet({
        id: accountSetItem.id,
        companyName: accountSetItem.companyName,
        level: accountSetItem.level!,
      })
    } else {
      clearAccountSet()
    }
    return accountSetList.value
  }

  /** 设置当前账套，并写入本地缓存 */
  function setAccountSet(value: FmsAccountSetContext) {
    if (accountSet.value?.id !== value.id) {
      currentMonth.value = undefined
    }
    accountSet.value = value
    uni.setStorageSync(FMS_ACCOUNT_SET_CACHE_KEY, value)
  }

  /** 加载当前账套的会计期间 */
  async function loadCurrentMonth(): Promise<string | undefined> {
    const accountSetId = accountSet.value?.id
    if (!accountSetId) {
      return undefined
    }
    const month = await getCurrentMonth(accountSetId)
    if (accountSet.value?.id !== accountSetId) {
      return undefined // 期间返回时账套已切换，丢弃过期结果
    }
    currentMonth.value = month
    return month
  }

  /** 清空当前账套及会计期间 */
  function clearAccountSet() {
    accountSet.value = undefined
    currentMonth.value = undefined
    uni.removeStorageSync(FMS_ACCOUNT_SET_CACHE_KEY)
  }

  return {
    accountSet,
    currentMonth,
    accountSetList,
    accountSetListLoaded,
    isAccountSetWritable,
    loadAccountSetList,
    setAccountSet,
    loadCurrentMonth,
    clearAccountSet,
  }
})
