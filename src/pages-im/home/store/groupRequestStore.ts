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
import { initDb, StorageKeys } from '@/pages-im/utils/db'
import { runIncrementalPull } from '@/pages-im/utils/pull'
import { ImGroupRequestHandleResult } from '@/pages-im/utils/constants'
import {
  enqueueResourceWrite,
  ResourceWriteKey,
} from '@/pages-im/utils/resourceRequest'

let pendingUnhandledFetch: Promise<void> | null = null // 未处理申请加载任务
let groupRequestMutationSequence = 0
const groupRequestVersions = new Map<number, { sequence: number, unhandled: boolean }>()

/** 记录已处理申请的本地顺序 */
function markGroupRequestHandled(requestId: number): void {
  groupRequestVersions.set(requestId, {
    sequence: ++groupRequestMutationSequence,
    unhandled: false,
  })
}

/** 记录新增或刷新的未处理申请顺序 */
function markGroupRequestUnhandled(requestId: number): void {
  groupRequestVersions.set(requestId, {
    sequence: ++groupRequestMutationSequence,
    unhandled: true,
  })
}

/** 获取远端请求发出后的最新申请状态 */
function getGroupRequestMutationAfter(
  requestId: number,
  requestStartedAt: number,
): { sequence: number, unhandled: boolean } | undefined {
  const mutation = groupRequestVersions.get(requestId)
  return mutation && mutation.sequence > requestStartedAt ? mutation : undefined
}

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
    rows = [...unhandledList.value],
    db?: ImDbClient,
  ): void {
    void (async () => {
      const client = db || await initDb()
      await enqueueResourceWrite(ResourceWriteKey.GROUP_REQUEST_LIST, async () => {
        await client.clearStore('groupRequests')
        await client.bulkPut<GroupRequestDO>('groupRequests', rows)
      })
    })().catch(error => console.warn('[IM groupRequestStore] 本地加群申请缓存写入失败', error))
  }

  /** 保存单条加群申请 */
  async function saveGroupRequestRecord(
    request: ImGroupRequestRespVO,
    db?: ImDbClient,
  ): Promise<void> {
    const client = db || await initDb()
    await enqueueResourceWrite(ResourceWriteKey.GROUP_REQUEST_LIST, () =>
      client.put('groupRequests', request))
  }

  /** 拉取我管理群下的未处理申请 */
  async function fetchUnhandledGroupRequestList(
  ) {
    if (pendingUnhandledFetch) {
      return pendingUnhandledFetch
    }
    loading.value = true
    const requestStartedAt = groupRequestMutationSequence
    const promise = (async () => {
      const db = await initDb()
      const list = await apiGetUnhandledRequestList()
      const preserved = unhandledList.value.filter(request =>
        getGroupRequestMutationAfter(request.id, requestStartedAt)?.unhandled === true)
      const preservedIds = new Set(preserved.map(request => request.id))
      unhandledList.value = [
        ...preserved,
        ...(list || []).filter(request =>
          !preservedIds.has(request.id)
          && getGroupRequestMutationAfter(request.id, requestStartedAt)?.unhandled
          !== false),
      ]
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
    const requestStartedAt = groupRequestMutationSequence
    const request = await apiGetMyGroupRequest(requestId)
    if (!request) {
      return
    }
    await upsertGroupRequestForPull(request, requestStartedAt, db)
  }

  /** 本地合并单条加群申请 */
  function upsertGroupRequest(
    request: ImGroupRequestRespVO,
  ) {
    void upsertGroupRequestForPull(request).catch(error =>
      console.warn('[IM groupRequestStore] 本地加群申请写入失败', error))
  }

  /** 增量拉取时合并单条加群申请 */
  async function upsertGroupRequestForPull(
    request: ImGroupRequestRespVO,
    requestStartedAt = groupRequestMutationSequence,
    db?: ImDbClient,
  ): Promise<void> {
    if (getGroupRequestMutationAfter(request.id, requestStartedAt)) {
      return
    }
    if (request.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
      await removeGroupRequestByIdForPull(request.id, db)
      return
    }
    markGroupRequestUnhandled(request.id)
    unhandledList.value = [request, ...unhandledList.value.filter(item => item.id !== request.id)]
    await saveGroupRequestRecord(request, db)
  }

  /** 增量拉取加群申请变更 */
  async function pullGroupRequests() {
    const pageRequestStarts = new WeakMap<ImGroupRequestRespVO[], number>()
    const db = await initDb()
    await runIncrementalPull(db, StorageKeys.settings.groupRequestPullCursor, async (params) => {
      const requestStartedAt = groupRequestMutationSequence
      const records = await apiPullMyGroupRequestList(params)
      pageRequestStarts.set(records, requestStartedAt)
      return records
    }, async (records) => {
      const requestStartedAt = pageRequestStarts.get(records) ?? groupRequestMutationSequence
      await Promise.all(records.map(request =>
        upsertGroupRequestForPull(request, requestStartedAt, db)))
      return true
    })
    loaded.value = true
  }

  /** 按编号移除已处理申请 */
  function removeGroupRequestById(
    requestId: number,
    db?: ImDbClient,
  ) {
    markGroupRequestHandled(requestId)
    unhandledList.value = unhandledList.value.filter(request => request.id !== requestId)
    void (async () => {
      const client = db || await initDb()
      await enqueueResourceWrite(ResourceWriteKey.GROUP_REQUEST_LIST, () =>
        client.delete('groupRequests', requestId))
    })().catch(error => console.warn('[IM groupRequestStore] 本地加群申请删除失败', error))
  }

  /** 增量拉取时删除单条申请 */
  async function removeGroupRequestByIdForPull(
    requestId: number,
    db?: ImDbClient,
  ): Promise<void> {
    markGroupRequestHandled(requestId)
    unhandledList.value = unhandledList.value.filter(request => request.id !== requestId)
    const client = db || await initDb()
    await enqueueResourceWrite(ResourceWriteKey.GROUP_REQUEST_LIST, () =>
      client.delete('groupRequests', requestId))
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
    groupRequestVersions.clear()
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
