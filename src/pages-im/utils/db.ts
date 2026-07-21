// IM 本地数据库：统一入口 + 按平台分发
// - H5：IndexedDB
// - 微信小程序：uni storage 分页分片
// - App：plus.sqlite
// 业务侧只依赖本文件；具体平台实现收口到 ./db
// noinspection JSUnusedAssignment

import type { ImDbClient } from './db/client'
import { useUserStore } from '@/store/user'
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
let initialization: {
  userId: number
  promise: Promise<ImDbClient>
} | undefined

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

/** 初始化当前用户的 IM 本地库 */
export async function initDb(): Promise<ImDbClient> {
  const userId = useUserStore().userInfo.userId
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error('当前用户不存在，无法初始化 IM 本地库')
  }
  if (client?.userId === userId) {
    return client
  }
  if (initialization?.userId === userId) {
    return initialization.promise
  }
  const nextClient = createImDbClient()
  if (!nextClient) {
    throw new Error('当前平台暂未配置 IM 本地数据库')
  }
  const promise = (async () => {
    try {
      await nextClient.open(userId)
    } catch (error) {
      await nextClient.close().catch(() => undefined)
      throw error
    }
    if (initialization?.promise !== promise || useUserStore().userInfo.userId !== userId) {
      await nextClient.close().catch(() => undefined)
      throw new Error('IM 本地库初始化已失效')
    }
    const previousClient = client
    client = nextClient
    if (previousClient) {
      await previousClient.close()
    }
    return nextClient
  })()
  initialization = { userId, promise }
  try {
    return await promise
  } finally {
    if (initialization?.promise === promise) {
      initialization = undefined
    }
  }
}

/** 获取当前 IM 本地库客户端 */
export function getDb(): ImDbClient {
  if (!client || client.userId !== useUserStore().userInfo.userId) {
    throw new Error('IM 本地库未初始化，请先调用 initDb()')
  }
  return client
}

/** 关闭并重置 IM 本地库 */
export async function closeDb(): Promise<void> {
  initialization = undefined
  const previousClient = client
  client = null
  await previousClient?.close()
}

export * from './db/client'
export * from './db/types'
