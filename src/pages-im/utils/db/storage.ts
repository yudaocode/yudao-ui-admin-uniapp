// IM 本地数据库：微信小程序 storage 适配层
// messages 按「会话 + 分页」分片，限制单 Key 体积并按页淘汰历史消息

import type { ImDbClient } from './client'
import type { DbStoreName, MessageDO, SettingDO } from './types'
import { STORE_SCHEMA } from './types'

type AnyRecord = Record<string, any>

interface MessagePartitionMeta {
  clientConversationId: string
  pages: Array<{ id: number, count: number, minSendTime: number, maxSendTime: number }>
  nextPageId: number
  updateTime: number
}

const MESSAGE_PAGE_SIZE = 100
const MAX_PAGES_PER_CONVERSATION = 12
const MAX_TOTAL_MESSAGE_PAGES = 80

export class StorageDbClient implements ImDbClient {
  private prefix = ''

  async open(userId: number): Promise<void> {
    this.prefix = `im:${userId}:`
    this.pruneMessagePages()
  }

  close(): void {
    this.prefix = ''
  }

  /** 普通表的存储 key */
  private storeKey(store: DbStoreName): string {
    return `${this.prefix}${store}`
  }

  /** messages 会话元数据 key */
  private messageMetaKey(clientConversationId: string): string {
    return `${this.prefix}messages:${clientConversationId}:meta`
  }

  /** messages 分页 key */
  private messagePageKey(clientConversationId: string, pageId: number): string {
    return `${this.prefix}messages:${clientConversationId}:page:${pageId}`
  }

  /** 当前用户全部 storage keys */
  private storageKeys(): string[] {
    try {
      return uni.getStorageInfoSync().keys || []
    } catch {
      return []
    }
  }

  /** 列出 messages 会话元数据 key */
  private messageMetaKeys(): string[] {
    const prefix = `${this.prefix}messages:`
    return this.storageKeys().filter(key => key.startsWith(prefix) && key.endsWith(':meta'))
  }

  /** 从元数据 key 解析会话编号 */
  private conversationIdFromMetaKey(key: string): string {
    return key.slice(`${this.prefix}messages:`.length, -':meta'.length)
  }

  /** 读取一个 map（不存在返回空对象） */
  private readMap(key: string): Record<string, AnyRecord> {
    const value = uni.getStorageSync(key)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  }

  /** 写入一个 map；容量不足时先淘汰历史分页再重试 */
  private writeMap(key: string, map: Record<string, AnyRecord>): void {
    try {
      uni.setStorageSync(key, map)
    } catch (error) {
      this.pruneMessagePages(true)
      try {
        uni.setStorageSync(key, map)
      } catch {
        throw error
      }
    }
  }

  /** 读取会话分页元数据 */
  private readMessageMeta(clientConversationId: string): MessagePartitionMeta {
    const value = uni.getStorageSync(this.messageMetaKey(clientConversationId)) as MessagePartitionMeta | undefined
    return value?.clientConversationId === clientConversationId
      ? value
      : { clientConversationId, pages: [], nextPageId: 1, updateTime: Date.now() }
  }

  /** 保存会话分页元数据 */
  private writeMessageMeta(meta: MessagePartitionMeta): void {
    meta.updateTime = Date.now()
    uni.setStorageSync(this.messageMetaKey(meta.clientConversationId), meta)
  }

  /** 更新分页统计 */
  private refreshPageMeta(meta: MessagePartitionMeta, pageId: number, map: Record<string, AnyRecord>): void {
    const messages = Object.values(map) as MessageDO[]
    const page = meta.pages.find(item => item.id === pageId)
    if (!page) {
      return
    }
    page.count = messages.length
    page.minSendTime = messages.length ? Math.min(...messages.map(item => item.sendTime || 0)) : 0
    page.maxSendTime = messages.length ? Math.max(...messages.map(item => item.sendTime || 0)) : 0
  }

  /** 向指定会话批量写消息 */
  private putMessages(clientConversationId: string, records: AnyRecord[]): void {
    const meta = this.readMessageMeta(clientConversationId)
    records.forEach((record) => {
      const messageKey = String(record.messageKey)
      let targetPageId: number | undefined
      for (const page of [...meta.pages].reverse()) {
        const pageMap = this.readMap(this.messagePageKey(clientConversationId, page.id))
        if (pageMap[messageKey]) {
          pageMap[messageKey] = record
          this.writeMap(this.messagePageKey(clientConversationId, page.id), pageMap)
          this.refreshPageMeta(meta, page.id, pageMap)
          targetPageId = page.id
          break
        }
      }
      if (targetPageId) {
        return
      }
      let page = meta.pages.at(-1)
      let pageMap = page ? this.readMap(this.messagePageKey(clientConversationId, page.id)) : {}
      if (!page || Object.keys(pageMap).length >= MESSAGE_PAGE_SIZE) {
        page = { id: meta.nextPageId++, count: 0, minSendTime: 0, maxSendTime: 0 }
        meta.pages.push(page)
        pageMap = {}
      }
      pageMap[messageKey] = record
      this.writeMap(this.messagePageKey(clientConversationId, page.id), pageMap)
      this.refreshPageMeta(meta, page.id, pageMap)
    })
    while (meta.pages.length > MAX_PAGES_PER_CONVERSATION) {
      const page = meta.pages.shift()!
      uni.removeStorageSync(this.messagePageKey(clientConversationId, page.id))
    }
    this.writeMessageMeta(meta)
  }

  /** 限制全局消息分页数量；容量异常时额外释放四分之一 */
  private pruneMessagePages(aggressive = false): void {
    const metas = this.messageMetaKeys()
      .map(key => this.readMessageMeta(this.conversationIdFromMetaKey(key)))
      .sort((a, b) => a.updateTime - b.updateTime)
    let totalPages = metas.reduce((sum, meta) => sum + meta.pages.length, 0)
    const target = aggressive ? Math.floor(MAX_TOTAL_MESSAGE_PAGES * 0.75) : MAX_TOTAL_MESSAGE_PAGES
    for (const meta of metas) {
      while (totalPages > target && meta.pages.length > 1) {
        const page = meta.pages.shift()!
        uni.removeStorageSync(this.messagePageKey(meta.clientConversationId, page.id))
        totalPages--
      }
      this.writeMessageMeta(meta)
      if (totalPages <= target) {
        break
      }
    }
  }

  async get<T>(store: DbStoreName, key: string | number): Promise<T | undefined> {
    if (store === 'messages') {
      for (const metaKey of this.messageMetaKeys()) {
        const clientConversationId = this.conversationIdFromMetaKey(metaKey)
        const meta = this.readMessageMeta(clientConversationId)
        for (const page of meta.pages) {
          const hit = this.readMap(this.messagePageKey(clientConversationId, page.id))[String(key)]
          if (hit) {
            return hit as T
          }
        }
      }
      return undefined
    }
    return this.readMap(this.storeKey(store))[String(key)] as T | undefined
  }

  async getAll<T>(store: DbStoreName): Promise<T[]> {
    if (store === 'messages') {
      const out: T[] = []
      this.messageMetaKeys().forEach((metaKey) => {
        const clientConversationId = this.conversationIdFromMetaKey(metaKey)
        const meta = this.readMessageMeta(clientConversationId)
        meta.pages.forEach((page) => {
          out.push(...Object.values(this.readMap(this.messagePageKey(clientConversationId, page.id))) as T[])
        })
      })
      return out
    }
    return Object.values(this.readMap(this.storeKey(store))) as T[]
  }

  async put<T>(store: DbStoreName, value: T): Promise<void> {
    const keyPath = STORE_SCHEMA[store].keyPath
    const record = value as AnyRecord
    if (store === 'messages') {
      this.putMessages(record.clientConversationId, [record])
      this.pruneMessagePages()
      return
    }
    const mapKey = this.storeKey(store)
    const map = this.readMap(mapKey)
    map[record[keyPath]] = record
    this.writeMap(mapKey, map)
  }

  async bulkPut<T>(store: DbStoreName, values: T[]): Promise<void> {
    if (!values.length) {
      return
    }
    const keyPath = STORE_SCHEMA[store].keyPath
    if (store === 'messages') {
      const groups = new Map<string, AnyRecord[]>()
      ;(values as AnyRecord[]).forEach((record) => {
        const list = groups.get(record.clientConversationId) || []
        list.push(record)
        groups.set(record.clientConversationId, list)
      })
      groups.forEach((records, clientConversationId) => this.putMessages(clientConversationId, records))
      this.pruneMessagePages()
      return
    }
    const mapKey = this.storeKey(store)
    const map = this.readMap(mapKey)
    ;(values as AnyRecord[]).forEach((record) => {
      map[record[keyPath]] = record
    })
    this.writeMap(mapKey, map)
  }

  async delete(store: DbStoreName, key: string | number): Promise<void> {
    if (store === 'messages') {
      for (const metaKey of this.messageMetaKeys()) {
        const clientConversationId = this.conversationIdFromMetaKey(metaKey)
        const meta = this.readMessageMeta(clientConversationId)
        for (const page of meta.pages) {
          const pageKey = this.messagePageKey(clientConversationId, page.id)
          const map = this.readMap(pageKey)
          if (map[String(key)]) {
            delete map[String(key)]
            this.writeMap(pageKey, map)
            this.refreshPageMeta(meta, page.id, map)
            this.writeMessageMeta(meta)
            return
          }
        }
      }
      return
    }
    const mapKey = this.storeKey(store)
    const map = this.readMap(mapKey)
    delete map[String(key)]
    this.writeMap(mapKey, map)
  }

  async clearStore(store: DbStoreName): Promise<void> {
    if (store === 'messages') {
      this.messageMetaKeys().forEach((metaKey) => {
        const clientConversationId = this.conversationIdFromMetaKey(metaKey)
        const meta = this.readMessageMeta(clientConversationId)
        meta.pages.forEach(page => uni.removeStorageSync(this.messagePageKey(clientConversationId, page.id)))
        uni.removeStorageSync(metaKey)
      })
      return
    }
    uni.setStorageSync(this.storeKey(store), {})
  }

  async filter<T>(store: DbStoreName, predicate: (record: T) => boolean): Promise<T[]> {
    return (await this.getAll<T>(store)).filter(predicate)
  }

  async removeWhere<T>(store: DbStoreName, predicate: (record: T) => boolean): Promise<void> {
    if (store !== 'messages') {
      const mapKey = this.storeKey(store)
      const map = this.readMap(mapKey)
      Object.keys(map).forEach((mapKey) => {
        if (predicate(map[mapKey] as T)) {
          delete map[mapKey]
        }
      })
      this.writeMap(mapKey, map)
      return
    }
    this.messageMetaKeys().forEach((metaKey) => {
      const clientConversationId = this.conversationIdFromMetaKey(metaKey)
      const meta = this.readMessageMeta(clientConversationId)
      meta.pages.forEach((page) => {
        const pageKey = this.messagePageKey(clientConversationId, page.id)
        const map = this.readMap(pageKey)
        let changed = false
        Object.keys(map).forEach((mapKey) => {
          if (predicate(map[mapKey] as T)) {
            delete map[mapKey]
            changed = true
          }
        })
        if (changed) {
          this.writeMap(pageKey, map)
          this.refreshPageMeta(meta, page.id, map)
        }
      })
      this.writeMessageMeta(meta)
    })
  }

  async getMessageListByConversation(
    clientConversationId: string,
    options?: { beforeSendTime?: number, limit?: number },
  ): Promise<MessageDO[]> {
    const limit = options?.limit ?? 50
    const upper = options?.beforeSendTime ?? Number.MAX_SAFE_INTEGER
    const meta = this.readMessageMeta(clientConversationId)
    const list: MessageDO[] = []
    for (const page of [...meta.pages].sort((a, b) => b.maxSendTime - a.maxSendTime)) {
      list.push(...Object.values(this.readMap(this.messagePageKey(clientConversationId, page.id))) as MessageDO[])
    }
    return list
      .filter(message => message.sendTime < upper)
      .sort((a, b) => b.sendTime - a.sendTime)
      .slice(0, limit)
      .reverse()
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const item = this.readMap(this.storeKey('settings'))[key] as SettingDO<T> | undefined
    return item?.value
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const mapKey = this.storeKey('settings')
    const map = this.readMap(mapKey)
    map[key] = { key, value, updateTime: Date.now() }
    this.writeMap(mapKey, map)
  }

  async setSettingMax(key: string, value: number): Promise<void> {
    const mapKey = this.storeKey('settings')
    const map = this.readMap(mapKey)
    const current = map[key] as SettingDO<number> | undefined
    if (value <= Number(current?.value || 0)) {
      return
    }
    map[key] = { key, value, updateTime: Date.now() }
    this.writeMap(mapKey, map)
  }
}
