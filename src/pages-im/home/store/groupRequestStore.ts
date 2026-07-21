import type { ImGroupRequestRespVO } from '@/api/im/group/request'
import type { ImDbClient } from '@/pages-im/utils/db'
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
import { ImGroupRequestHandleResult } from '@/pages-im/utils/constants'
import {
  enqueueResourceWrite,
  ResourceWriteKey,
} from '@/pages-im/utils/resourceRequest'

let pendingUnhandledFetch: Promise<void> | null = null // 未处理申请加载任务
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

  /** 从本地库恢复加群申请 */
  async function loadGroupRequestList(): Promise<boolean> {
    try {
      const db = await initDb()
      const cached = await db.getAll<GroupRequestDO>('groupRequests')
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
  function saveGroupRequestList(
    rows: ImGroupRequestRespVO[],
    db: ImDbClient,
  ): void {
    void (async () => {
      await enqueueResourceWrite(ResourceWriteKey.GROUP_REQUEST_LIST, async () => {
        await db.clearStore('groupRequests')
        await db.bulkPut<GroupRequestDO>('groupRequests', rows)
      })
    })().catch(error => console.warn('[IM groupRequestStore] 本地加群申请缓存写入失败', error))
  }

  /** 保存单条加群申请 */
  async function saveGroupRequestRecord(
    request: ImGroupRequestRespVO,
    db: ImDbClient,
  ): Promise<void> {
    await enqueueResourceWrite(ResourceWriteKey.GROUP_REQUEST_LIST, () =>
      db.put('groupRequests', request))
  }

  /** 拉取我管理群下的未处理申请 */
  async function fetchUnhandledGroupRequestList(
  ) {
    if (pendingUnhandledFetch) {
      return pendingUnhandledFetch
    }
    loading.value = true
    const promise = (async () => {
      const db = await initDb()
      const list = await apiGetUnhandledRequestList()
      unhandledList.value = list || []
      loaded.value = true
      saveGroupRequestList([...unhandledList.value], db)
    })().finally(() => {
      if (pendingUnhandledFetch === promise) {
        pendingUnhandledFetch = null
        loading.value = false
      }
    })
    pendingUnhandledFetch = promise
    return promise
  }

  /** 按编号加载并置顶一条加群申请 */
  async function addGroupRequestById(requestId: number) {
    const db = await initDb()
    const request = await apiGetMyGroupRequest(requestId)
    if (!request) {
      return
    }
    await upsertGroupRequestForPull(request, db)
  }

  /** 增量拉取时合并单条加群申请 */
  async function upsertGroupRequestForPull(
    request: ImGroupRequestRespVO,
    db: ImDbClient,
  ): Promise<void> {
    if (request.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
      await removeGroupRequestByIdForPull(request.id, db)
      return
    }
    unhandledList.value = [request, ...unhandledList.value.filter(item => item.id !== request.id)]
    await saveGroupRequestRecord(request, db)
  }

  /** 增量拉取加群申请变更 */
  async function pullGroupRequests() {
    const db = await initDb()
    await runIncrementalPull(
      db,
      StorageKeys.settings.groupRequestPullCursor,
      params => apiPullMyGroupRequestList(params),
      async (records) => {
        await Promise.all(records.map(request =>
          upsertGroupRequestForPull(request, db)))
        return true
      },
    )
    loaded.value = true
  }

  /** 按编号移除已处理申请 */
  function removeGroupRequestById(
    requestId: number,
    db: ImDbClient = getDb(),
  ) {
    unhandledList.value = unhandledList.value.filter(request => request.id !== requestId)
    void enqueueResourceWrite(ResourceWriteKey.GROUP_REQUEST_LIST, () =>
      db.delete('groupRequests', requestId))
      .catch(error => console.warn('[IM groupRequestStore] 本地加群申请删除失败', error))
  }

  /** 增量拉取时删除单条申请 */
  async function removeGroupRequestByIdForPull(
    requestId: number,
    db: ImDbClient,
  ): Promise<void> {
    unhandledList.value = unhandledList.value.filter(request => request.id !== requestId)
    await enqueueResourceWrite(ResourceWriteKey.GROUP_REQUEST_LIST, () =>
      db.delete('groupRequests', requestId))
  }

  /** 同意加群申请 */
  async function agreeGroupRequest(requestId: number) {
    const db = await initDb()
    await apiAgreeGroupRequest(requestId)
    removeGroupRequestById(requestId, db)
    return true
  }

  /** 拒绝加群申请 */
  async function refuseGroupRequest(requestId: number, handleContent?: string) {
    const db = await initDb()
    await apiRefuseGroupRequest(requestId, handleContent)
    removeGroupRequestById(requestId, db)
    return true
  }

  /** 清空加群申请内存 */
  function clear() {
    unhandledList.value = []
    loaded.value = false
    loading.value = false
    pendingUnhandledFetch = null
  }

  return {
    unhandledList,
    loaded,
    loading,
    getUnhandledGroupRequestCount,
    loadGroupRequestList,
    fetchUnhandledGroupRequestList,
    addGroupRequestById,
    pullGroupRequests,
    removeGroupRequestById,
    agreeGroupRequest,
    refuseGroupRequest,
    clear,
  }
})
