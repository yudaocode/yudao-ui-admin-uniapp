// IM 本地数据库：统一入口 + 按平台分发
// - H5：IndexedDB
// - 微信小程序：uni storage 分页分片
// - App：plus.sqlite
// 业务侧只依赖本文件；具体平台实现收口到 ./db
// noinspection JSUnusedAssignment

import type { ImDbClient } from './db/client'
import { ImConversationType } from '@/pages-im/utils/constants'
import { useUserStore } from '@/store/user'
import { StorageKeys } from './db/types'
// #ifdef H5
import { IndexedDbClient } from './db/indexeddb'
// #endif
// #ifdef MP
import { StorageDbClient } from './db/storage'
// #endif
// #ifdef APP-PLUS
import { SqliteDbClient } from './db/sqlite'
// #endif

let client: ImDbClient | null = null
let currentUserId = 0
let initGeneration = 0 // 初始化代次；账号切换后旧客户端不得发布
let initialization: { userId: number, promise: Promise<void> } | undefined

/** 判断是否仍为当前数据库会话 */
export function isCurrentDbSession(session: number) {
  return session === initGeneration
}

/** 获取当前数据库会话编号 */
export function getDbSession() {
  return initGeneration
}

/** 创建当前平台的本地库客户端 */
function createImDbClient(): ImDbClient | null {
  let nextClient: ImDbClient | null = null
  // #ifdef H5
  nextClient = new IndexedDbClient()
  // #endif
  // #ifdef MP
  nextClient = new StorageDbClient()
  // #endif
  // #ifdef APP-PLUS
  nextClient = new SqliteDbClient()
  // #endif
  return nextClient
}

/** 初始化当前用户的 IM 本地库（重复调用同一用户为幂等） */
export async function initImDb(): Promise<void> {
  const userId = useUserStore().userInfo.userId
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error('当前用户不存在，无法初始化 IM 本地库')
  }
  if (client && currentUserId === userId) {
    return
  }
  if (initialization?.userId === userId) {
    return initialization.promise
  }
  const nextClient = createImDbClient()
  if (!nextClient) {
    throw new Error('当前平台暂未配置 IM 本地数据库')
  }
  const generation = ++initGeneration
  const promise = (async () => {
    await nextClient.open(userId)
    if (generation !== initGeneration || useUserStore().userInfo.userId !== userId) {
      nextClient.close()
      throw new Error('IM 本地库初始化已失效')
    }
    const previousClient = client
    client = nextClient
    currentUserId = userId
    previousClient?.close()
  })()
  initialization = { userId, promise }
  try {
    await promise
  } finally {
    if (initialization?.promise === promise) {
      initialization = undefined
    }
  }
}

/** 初始化当前用户 IM 本地库（名称与 PC 对齐） */
export const initDb = initImDb

/** 获取当前 IM 本地库客户端 */
export function getImDb(): ImDbClient {
  if (!client || currentUserId !== useUserStore().userInfo.userId) {
    throw new Error('IM 本地库未初始化，请先调用 initImDb()')
  }
  return client
}

/** 获取当前 IM 本地库客户端（名称与 PC 对齐） */
export const getDb = getImDb

/** 关闭并重置 IM 本地库（退出登录 / 切换账号时调用） */
export function closeImDb(): void {
  initGeneration++
  initialization = undefined
  client?.close()
  client = null
  currentUserId = 0
}

/** 单调递增保存消息拉取游标 */
export async function setMessageMaxId(
  conversationType: number,
  maxId?: number,
): Promise<void> {
  if (!maxId) {
    return
  }
  let key: string
  switch (conversationType) {
    case ImConversationType.PRIVATE:
      key = StorageKeys.settings.privateMessageMaxId
      break
    case ImConversationType.GROUP:
      key = StorageKeys.settings.groupMessageMaxId
      break
    case ImConversationType.CHANNEL:
      key = StorageKeys.settings.channelMessageMaxId
      break
    default:
      throw new Error(`未知 IM 会话类型：${conversationType}`)
  }
  const db = getDb()
  await db.setSettingMax(key, maxId)
}

export * from './db/client'
export * from './db/types'
