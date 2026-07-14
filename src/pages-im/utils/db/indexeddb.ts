// IM 本地数据库：H5 IndexedDB 适配层
// 仅在 H5 端打包（见 ../db.ts 的条件编译导入）

import type { ImDbClient } from './client'
import type { DbStoreName, MessageDO, SettingDO } from './types'
import { DB_SCHEMA_VERSION, STORE_SCHEMA } from './types'

/** 包装 IndexedDB request */
function toPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** 等待事务完成 */
function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

/** 初始化/升级表结构 */
function upgradeSchema(db: IDBDatabase, transaction: IDBTransaction) {
  (Object.keys(STORE_SCHEMA) as DbStoreName[]).forEach((name) => {
    const schema = STORE_SCHEMA[name]
    const store = db.objectStoreNames.contains(name)
      ? transaction.objectStore(name)
      : db.createObjectStore(name, { keyPath: schema.keyPath })
    schema.indexes.forEach((index) => {
      if (!store.indexNames.contains(index.name)) {
        store.createIndex(index.name, index.keyPath, { unique: index.unique })
      }
    })
  })
}

export class IndexedDbClient implements ImDbClient {
  private db: IDBDatabase | null = null
  private userId = 0

  async open(userId: number): Promise<void> {
    if (this.db && this.userId === userId) {
      return
    }
    this.db?.close()
    this.userId = userId
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(`im:${userId}`, DB_SCHEMA_VERSION)
      request.onupgradeneeded = () => upgradeSchema(request.result, request.transaction!)
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close()
        resolve(request.result)
      }
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error('IM IndexedDB 升级被其他页面阻塞，请关闭其他页面后重试'))
    })
  }

  close(): void {
    this.db?.close()
    this.db = null
    this.userId = 0
  }

  private rawDb(): IDBDatabase {
    if (!this.db) {
      throw new Error('IM DB 未初始化')
    }
    return this.db
  }

  async get<T>(store: DbStoreName, key: string | number): Promise<T | undefined> {
    const tx = this.rawDb().transaction([store], 'readonly')
    return toPromise<T | undefined>(tx.objectStore(store).get(key))
  }

  async getAll<T>(store: DbStoreName): Promise<T[]> {
    const tx = this.rawDb().transaction([store], 'readonly')
    return toPromise<T[]>(tx.objectStore(store).getAll())
  }

  async put<T>(store: DbStoreName, value: T): Promise<void> {
    const tx = this.rawDb().transaction([store], 'readwrite')
    tx.objectStore(store).put(value)
    await transactionDone(tx)
  }

  async bulkPut<T>(store: DbStoreName, values: T[]): Promise<void> {
    if (!values.length) {
      return
    }
    const tx = this.rawDb().transaction([store], 'readwrite')
    const objectStore = tx.objectStore(store)
    values.forEach(value => objectStore.put(value))
    await transactionDone(tx)
  }

  async delete(store: DbStoreName, key: string | number): Promise<void> {
    const tx = this.rawDb().transaction([store], 'readwrite')
    tx.objectStore(store).delete(key)
    await transactionDone(tx)
  }

  async clearStore(store: DbStoreName): Promise<void> {
    const tx = this.rawDb().transaction([store], 'readwrite')
    tx.objectStore(store).clear()
    await transactionDone(tx)
  }

  async filter<T>(store: DbStoreName, predicate: (record: T) => boolean): Promise<T[]> {
    const all = await this.getAll<T>(store)
    return all.filter(predicate)
  }

  async removeWhere<T>(store: DbStoreName, predicate: (record: T) => boolean): Promise<void> {
    const keyPath = STORE_SCHEMA[store].keyPath
    const matched = await this.filter<T>(store, predicate)
    if (!matched.length) {
      return
    }
    const tx = this.rawDb().transaction([store], 'readwrite')
    const objectStore = tx.objectStore(store)
    matched.forEach((record) => {
      objectStore.delete((record as Record<string, any>)[keyPath])
    })
    await transactionDone(tx)
  }

  async getMessageListByConversation(
    clientConversationId: string,
    options?: { beforeSendTime?: number, limit?: number },
  ): Promise<MessageDO[]> {
    const limit = options?.limit ?? 50
    const upper = options?.beforeSendTime ?? Number.MAX_SAFE_INTEGER
    const range = IDBKeyRange.bound(
      [clientConversationId, 0],
      [clientConversationId, upper],
      false,
      true,
    )
    const tx = this.rawDb().transaction(['messages'], 'readonly')
    const index = tx.objectStore('messages').index('clientConversationId+sendTime')
    const out: MessageDO[] = []
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range, 'prev')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor || out.length >= limit) {
          resolve()
          return
        }
        out.push(cursor.value as MessageDO)
        cursor.continue()
      }
    })
    return out.reverse()
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const item = await this.get<SettingDO<T>>('settings', key)
    return item?.value
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    await this.put<SettingDO<T>>('settings', { key, value, updateTime: Date.now() })
  }

  async setSettingMax(key: string, value: number): Promise<void> {
    const tx = this.rawDb().transaction(['settings'], 'readwrite')
    const store = tx.objectStore('settings')
    const current = await toPromise<SettingDO<number> | undefined>(store.get(key))
    if (value > Number(current?.value || 0)) {
      store.put({ key, value, updateTime: Date.now() } satisfies SettingDO<number>)
    }
    await transactionDone(tx)
  }
}
