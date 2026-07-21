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
  ResourceRequestKey,
  ResourceRequestMode,
  ResourceWriteKey,
  runResourceRequest,
} from '@/pages-im/utils/resourceRequest'

/** IM 加群申请 Store */
export const useGroupRequestStore = defineStore('imGroupRequestStore', () => {
  const unhandledList = ref<ImGroupRequestRespVO[]>([]) // 当前未处理加群申请
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
  async function loadGroupRequestList(): Promise<void> {
    try {
      const db = await initDb()
      const cached = await db.getAll<GroupRequestDO>('groupRequests')
      if (cached.length === 0) {
        return
      }
      unhandledList.value = cached
        .filter(request => request.handleResult === ImGroupRequestHandleResult.UNHANDLED)
        .sort((left, right) => right.id - left.id)
    } catch (error) {
      console.warn('[IM groupRequestStore] 本地加群申请缓存读取失败', error)
    }
  }

  /** 拉取我管理群下的未处理申请 */
  function fetchUnhandledGroupRequestList(): Promise<void> {
    return runResourceRequest(ResourceRequestKey.GROUP_REQUEST_UNHANDLED, async () => {
      loading.value = true
      try {
        const db = await initDb()
        unhandledList.value = await apiGetUnhandledRequestList()
        const rows = [...unhandledList.value]
        void enqueueResourceWrite(ResourceWriteKey.GROUP_REQUEST_LIST, async () => {
          await db.clearStore('groupRequests')
          await db.bulkPut<GroupRequestDO>('groupRequests', rows)
        }).catch(error => console.warn('[IM groupRequestStore] 本地加群申请缓存写入失败', error))
      } finally {
        loading.value = false
      }
    }, { mode: ResourceRequestMode.SINGLE_FLIGHT })
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
    await enqueueResourceWrite(ResourceWriteKey.GROUP_REQUEST_LIST, () =>
      db.put('groupRequests', request))
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
  }

  /** 拒绝加群申请 */
  async function refuseGroupRequest(requestId: number, handleContent?: string) {
    const db = await initDb()
    await apiRefuseGroupRequest(requestId, handleContent)
    removeGroupRequestById(requestId, db)
  }

  /** 清空加群申请内存 */
  function clear() {
    unhandledList.value = []
    loading.value = false
  }

  return {
    unhandledList,
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
