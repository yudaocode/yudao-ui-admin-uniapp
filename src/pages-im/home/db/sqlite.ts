// IM 本地数据库：App SQLite 适配层
// 使用 HTML5+ plus.sqlite，统一表保存各业务 store 的 JSON 记录
// noinspection SqlNoDataSourceInspection

import type { ImDbClient } from './client'
import type { DbStoreName, MessageDO, SettingDO } from './types'
import { STORE_SCHEMA } from './types'

declare const plus: any

interface SqliteRow {
  value: string
}

export class SqliteDbClient implements ImDbClient {
  private name = ''
  private path = ''
  private opened = false

  async open(userId: number): Promise<void> {
    const name = `im_user_${userId}`
    if (this.opened && this.name === name) {
      return
    }
    this.close()
    this.name = name
    this.path = `_doc/${name}.db`
    if (!plus.sqlite.isOpenDatabase({ name: this.name, path: this.path })) {
      await new Promise<void>((resolve, reject) => {
        plus.sqlite.openDatabase({
          name: this.name,
          path: this.path,
          success: resolve,
          fail: reject,
        })
      })
    }
    this.opened = true
    await this.execute(`
      CREATE TABLE IF NOT EXISTS im_records (
        store_name TEXT NOT NULL,
        record_key TEXT NOT NULL,
        conversation_id TEXT,
        send_time INTEGER NOT NULL DEFAULT 0,
        value TEXT NOT NULL,
        PRIMARY KEY (store_name, record_key)
      )
    `)
    await this.execute('CREATE INDEX IF NOT EXISTS idx_im_message_conversation_time ON im_records(store_name, conversation_id, send_time)')
  }

  close(): void {
    if (this.opened && plus.sqlite.isOpenDatabase({ name: this.name, path: this.path })) {
      plus.sqlite.closeDatabase({ name: this.name, success: () => undefined, fail: () => undefined })
    }
    this.opened = false
    this.name = ''
    this.path = ''
  }

  /** SQL 字符串安全转义 */
  private sqlValue(value: unknown): string {
    return `'${String(value ?? '').replace(/'/g, '\'\'')}'`
  }

  /** 执行 SQL */
  private execute(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      plus.sqlite.executeSql({ name: this.name, sql, success: () => resolve(), fail: reject })
    })
  }

  /** 查询 SQL */
  private select<T>(sql: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      plus.sqlite.selectSql({ name: this.name, sql, success: resolve, fail: reject })
    })
  }

  /** 事务操作 */
  private transaction(operation: 'begin' | 'commit' | 'rollback'): Promise<void> {
    return new Promise((resolve, reject) => {
      plus.sqlite.transaction({ name: this.name, operation, success: resolve, fail: reject })
    })
  }

  /** 构造 upsert SQL */
  private putSql<T>(store: DbStoreName, value: T): string {
    const record = value as Record<string, any>
    const key = record[STORE_SCHEMA[store].keyPath]
    const conversationId = store === 'messages' ? record.clientConversationId : ''
    const sendTime = store === 'messages' ? Number(record.sendTime || 0) : 0
    return `INSERT OR REPLACE INTO im_records(store_name, record_key, conversation_id, send_time, value) VALUES (`
      + `${this.sqlValue(store)}, ${this.sqlValue(key)}, ${this.sqlValue(conversationId)}, ${sendTime}, ${this.sqlValue(JSON.stringify(value))})`
  }

  async get<T>(store: DbStoreName, key: string | number): Promise<T | undefined> {
    const rows = await this.select<SqliteRow>(
      `SELECT value FROM im_records WHERE store_name = ${this.sqlValue(store)} AND record_key = ${this.sqlValue(key)} LIMIT 1`,
    )
    return rows[0] ? JSON.parse(rows[0].value) as T : undefined
  }

  async getAll<T>(store: DbStoreName): Promise<T[]> {
    const rows = await this.select<SqliteRow>(
      `SELECT value FROM im_records WHERE store_name = ${this.sqlValue(store)}`,
    )
    return rows.map(row => JSON.parse(row.value) as T)
  }

  async put<T>(store: DbStoreName, value: T): Promise<void> {
    await this.execute(this.putSql(store, value))
  }

  async bulkPut<T>(store: DbStoreName, values: T[]): Promise<void> {
    if (!values.length) {
      return
    }
    await this.transaction('begin')
    try {
      for (const value of values) {
        await this.execute(this.putSql(store, value))
      }
      await this.transaction('commit')
    } catch (error) {
      await this.transaction('rollback').catch(() => undefined)
      throw error
    }
  }

  async delete(store: DbStoreName, key: string | number): Promise<void> {
    await this.execute(
      `DELETE FROM im_records WHERE store_name = ${this.sqlValue(store)} AND record_key = ${this.sqlValue(key)}`,
    )
  }

  async clearStore(store: DbStoreName): Promise<void> {
    await this.execute(`DELETE FROM im_records WHERE store_name = ${this.sqlValue(store)}`)
  }

  async filter<T>(store: DbStoreName, predicate: (record: T) => boolean): Promise<T[]> {
    return (await this.getAll<T>(store)).filter(predicate)
  }

  async removeWhere<T>(store: DbStoreName, predicate: (record: T) => boolean): Promise<void> {
    const keyPath = STORE_SCHEMA[store].keyPath
    const matched = await this.filter<T>(store, predicate)
    if (!matched.length) {
      return
    }
    await this.transaction('begin')
    try {
      for (const record of matched) {
        await this.execute(
          `DELETE FROM im_records WHERE store_name = ${this.sqlValue(store)} AND record_key = ${this.sqlValue((record as Record<string, any>)[keyPath])}`,
        )
      }
      await this.transaction('commit')
    } catch (error) {
      await this.transaction('rollback').catch(() => undefined)
      throw error
    }
  }

  async getMessageListByConversation(
    clientConversationId: string,
    options?: { beforeSendTime?: number, limit?: number },
  ): Promise<MessageDO[]> {
    const upper = Number(options?.beforeSendTime ?? Number.MAX_SAFE_INTEGER)
    const limit = Math.max(1, Number(options?.limit ?? 50))
    const rows = await this.select<SqliteRow>(
      `SELECT value FROM im_records WHERE store_name = 'messages'`
      + ` AND conversation_id = ${this.sqlValue(clientConversationId)} AND send_time < ${upper}`
      + ` ORDER BY send_time DESC LIMIT ${limit}`,
    )
    return rows.map(row => JSON.parse(row.value) as MessageDO).reverse()
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    return (await this.get<SettingDO<T>>('settings', key))?.value
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    await this.put<SettingDO<T>>('settings', { key, value, updateTime: Date.now() })
  }
}
