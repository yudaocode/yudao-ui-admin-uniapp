import type { ImGroupRequestRespVO } from '@/api/im/group/request'
import type { GroupRequestDO } from '../types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  agreeGroupRequest as apiAgreeGroupRequest,
  getMyGroupRequest as apiGetMyGroupRequest,
  getUnhandledRequestList as apiGetUnhandledRequestList,
  pullMyGroupRequestList as apiPullMyGroupRequestList,
  refuseGroupRequest as apiRefuseGroupRequest,
} from '@/api/im/group/request'
import { getDb, initDb, StorageKeys } from '@/pages-im/utils/db'
import { runIncrementalPull } from '@/pages-im/utils/pull'
import { useUserStore } from '@/store/user'
import { ImGroupRequestHandleResult } from '@/pages-im/utils/constants'

interface PendingRequest {
  epoch: number
  userId: number
  promise: Promise<void>
}

let storeEpoch = 0 // 当前账号数据轮次
let pendingUnhandledFetch: PendingRequest | null = null // 未处理申请加载任务

/** IM 加群申请 Store */
export const useGroupRequestStore = defineStore('imGroupRequestStore', () => {
  const unhandledList = ref<ImGroupRequestRespVO[]>([]) // 当前未处理加群申请
  const loaded = ref(false) // 是否已成功加载未处理申请
  const loading = ref(false) // 移动端申请列表加载状态

  const getUnhandledGroupRequestCountMap = computed(() => { // 各群未处理申请数量
    const map = new Map<number, number>()
    for (const request of unhandledList.value) {
      map.set(request.groupId, (map.get(request.groupId) ?? 0) + 1)
    }
    return map
  })

  /** 获取指定群的未处理申请数量 */
  function getUnhandledGroupRequestCount(groupId: number) {
    return getUnhandledGroupRequestCountMap.value.get(groupId) ?? 0
  }

  /** 获取指定群的未处理申请列表 */
  function getUnhandledGroupRequestListByGroupId(groupId: number) {
    return unhandledList.value.filter(request => request.groupId === groupId)
  }

  /** 从本地库恢复加群申请 */
  async function loadGroupRequestList(): Promise<boolean> {
    try {
      await initDb()
      const cached = await getDb().getAll<GroupRequestDO>('groupRequests')
      if (!cached || cached.length === 0) {
        return false
      }
      unhandledList.value = cached
        .filter(request => request.handleResult === ImGroupRequestHandleResult.UNHANDLED)
        .sort((left, right) => right.id - left.id)
      return true
    } catch (error) {
      console.warn('[IM groupRequestStore] 本地加群申请缓存读取失败', error)
      return false
    }
  }

  /** 保存加群申请列表 */
  function saveGroupRequestList(): void {
    void (async () => {
      await initDb()
      const db = getDb()
      await db.clearStore('groupRequests')
      await db.bulkPut<GroupRequestDO>('groupRequests', unhandledList.value)
    })().catch(error => console.warn('[IM groupRequestStore] 本地加群申请缓存写入失败', error))
  }

  /** 保存单条加群申请 */
  async function saveGroupRequestRecord(request: ImGroupRequestRespVO): Promise<void> {
    await initDb()
    await getDb().put('groupRequests', request)
  }

  /** 异步保存单条加群申请 */
  function saveGroupRequest(request: ImGroupRequestRespVO): void {
    void saveGroupRequestRecord(request).catch(error =>
      console.warn('[IM groupRequestStore] 本地加群申请写入失败', error))
  }

  /** 拉取我管理群下的未处理申请 */
  async function fetchUnhandledGroupRequestList() {
    const requestEpoch = storeEpoch
    const requestUserId = useUserStore().userInfo.userId
    if (pendingUnhandledFetch?.epoch === requestEpoch
      && pendingUnhandledFetch.userId === requestUserId) {
      return pendingUnhandledFetch.promise
    }
    loading.value = true
    const promise = (async () => {
      const list = await apiGetUnhandledRequestList()
      if (requestEpoch !== storeEpoch || useUserStore().userInfo.userId !== requestUserId) {
        return
      }
      unhandledList.value = list || []
      loaded.value = true
      saveGroupRequestList()
    })().finally(() => {
      if (pendingUnhandledFetch?.epoch === requestEpoch
        && pendingUnhandledFetch.userId === requestUserId) {
        pendingUnhandledFetch = null
        loading.value = false
      }
    })
    pendingUnhandledFetch = { epoch: requestEpoch, userId: requestUserId, promise }
    return promise
  }

  /** 按编号加载并置顶一条加群申请 */
  async function addGroupRequestById(requestId: number) {
    const requestEpoch = storeEpoch
    const requestUserId = useUserStore().userInfo.userId
    const request = await apiGetMyGroupRequest(requestId)
    if (!request || requestEpoch !== storeEpoch || useUserStore().userInfo.userId !== requestUserId) {
      return
    }
    upsertGroupRequest(request)
  }

  /** 本地合并单条加群申请 */
  function upsertGroupRequest(request: ImGroupRequestRespVO) {
    void upsertGroupRequestForPull(request).catch(error =>
      console.warn('[IM groupRequestStore] 本地加群申请写入失败', error))
  }

  /** 增量拉取时合并单条加群申请 */
  async function upsertGroupRequestForPull(request: ImGroupRequestRespVO): Promise<void> {
    if (request.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
      await removeGroupRequestByIdForPull(request.id)
      return
    }
    unhandledList.value = [request, ...unhandledList.value.filter(item => item.id !== request.id)]
    await saveGroupRequestRecord(request)
  }

  /** 增量拉取加群申请变更 */
  async function pullGroupRequests() {
    const requestEpoch = storeEpoch
    const requestUserId = useUserStore().userInfo.userId
    const isActive = () => requestEpoch === storeEpoch
      && useUserStore().userInfo.userId === requestUserId
    await initDb()
    await runIncrementalPull(
      StorageKeys.settings.groupRequestPullCursor,
      apiPullMyGroupRequestList,
      async (records) => {
        if (!isActive()) {
          return false
        }
        await Promise.all(records.map(request => upsertGroupRequestForPull(request)))
        return true
      },
      isActive,
    )
    if (isActive()) {
      loaded.value = true
    }
  }

  /** 按编号移除已处理申请 */
  function removeGroupRequestById(requestId: number) {
    unhandledList.value = unhandledList.value.filter(request => request.id !== requestId)
    void (async () => {
      await initDb()
      await getDb().delete('groupRequests', requestId)
    })().catch(error => console.warn('[IM groupRequestStore] 本地加群申请删除失败', error))
  }

  /** 增量拉取时删除单条申请 */
  async function removeGroupRequestByIdForPull(requestId: number): Promise<void> {
    unhandledList.value = unhandledList.value.filter(request => request.id !== requestId)
    await initDb()
    await getDb().delete('groupRequests', requestId)
  }

  /** 同意加群申请 */
  async function agreeGroupRequest(requestId: number) {
    const requestEpoch = storeEpoch
    const requestUserId = useUserStore().userInfo.userId
    await apiAgreeGroupRequest(requestId)
    if (requestEpoch !== storeEpoch || useUserStore().userInfo.userId !== requestUserId) {
      return false
    }
    removeGroupRequestById(requestId)
    return true
  }

  /** 拒绝加群申请 */
  async function refuseGroupRequest(requestId: number, handleContent?: string) {
    const requestEpoch = storeEpoch
    const requestUserId = useUserStore().userInfo.userId
    await apiRefuseGroupRequest(requestId, handleContent)
    if (requestEpoch !== storeEpoch || useUserStore().userInfo.userId !== requestUserId) {
      return false
    }
    removeGroupRequestById(requestId)
    return true
  }

  /** 清空加群申请内存 */
  function clear() {
    unhandledList.value = []
    loaded.value = false
    loading.value = false
    storeEpoch++
    pendingUnhandledFetch = null
  }

  uni.$on('auth:logout', clear)

  return {
    // TODO @AI：有一些方法没在用，是因为没迁移么？    getUnhandledGroupRequestListByGroupId,
    //     loadGroupRequestList,
    //     saveGroupRequestList,
    //     saveGroupRequest,    upsertGroupRequest,
    unhandledList,
    loaded,
    loading,
    getUnhandledGroupRequestCountMap,
    getUnhandledGroupRequestCount,
    getUnhandledGroupRequestListByGroupId,
    loadGroupRequestList,
    saveGroupRequestList,
    saveGroupRequest,
    fetchUnhandledGroupRequestList,
    addGroupRequestById,
    upsertGroupRequest,
    pullGroupRequests,
    removeGroupRequestById,
    agreeGroupRequest,
    refuseGroupRequest,
    clear,
  }
})
