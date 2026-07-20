import type { ImDbClient } from './db'

/** 增量拉取游标 */
export interface PullCursor {
  lastUpdateTime?: number
  lastId?: number
}

interface PullRecord {
  id: number
  updateTime?: number
}

const PULL_PAGE_SIZE = 100 // 单次拉取条数
const PULL_MAX_PAGES = 100 // 状态事件单轮最多翻页数
const PULL_OVERLAP_MS = 5000 // 状态事件拉取回扫窗口
const MIN_ID_PULL_MAX_PAGES = 1000 // 消息类单轮最多翻页数

/** 读取某模块的拉取游标 */
export async function getPullCursor(db: ImDbClient, key: string): Promise<PullCursor> {
  return (await db.getSetting<PullCursor>(key)) ?? {}
}

/** 按更新时间和编号增量拉取状态记录 */
export async function runIncrementalPull<T extends PullRecord>(
  db: ImDbClient,
  cursorKey: string,
  fetchPage: (params: { lastUpdateTime?: number, lastId?: number, limit: number }) => Promise<T[]>,
  apply: (records: T[]) => boolean | Promise<boolean>,
): Promise<void> {
  const storedCursor = await getPullCursor(db, cursorKey)
  const highWater = { ...storedCursor }
  let cursor = storedCursor.lastUpdateTime != null
    ? { lastUpdateTime: Math.max(0, storedCursor.lastUpdateTime - PULL_OVERLAP_MS), lastId: 0 }
    : {}
  for (let page = 0; page < PULL_MAX_PAGES; page++) {
    const list = await fetchPage({
      lastUpdateTime: cursor.lastUpdateTime,
      lastId: cursor.lastId,
      limit: PULL_PAGE_SIZE,
    })
    if (list.length) {
      if (await apply(list) === false) {
        return
      }
      const last = list[list.length - 1]
      if (last.updateTime == null) {
        return
      }
      cursor = { lastUpdateTime: last.updateTime, lastId: last.id }
      if (highWater.lastUpdateTime == null
        || cursor.lastUpdateTime > highWater.lastUpdateTime
        || (cursor.lastUpdateTime === highWater.lastUpdateTime
          && cursor.lastId > (highWater.lastId ?? 0))) {
        highWater.lastUpdateTime = cursor.lastUpdateTime
        highWater.lastId = cursor.lastId
        await db.setSetting(cursorKey, highWater)
      }
    }
    if (list.length < PULL_PAGE_SIZE) {
      return
    }
  }
  console.warn(`[IM pull] ${cursorKey} 达到单轮翻页上限，提前结束本轮补偿`)
}

/** 按最小编号增量拉取消息，直到空页或游标不再前进 */
export async function runMinIdPull<T extends { id?: number }>(options: {
  initialMinId: number
  pageSize: number
  fetchPage: (params: { minId: number, size: number }) => Promise<T[]>
  applyPage: (records: T[], nextMinId?: number) => Promise<boolean | void>
  maxPages?: number
}): Promise<void> {
  const { initialMinId, pageSize, fetchPage, applyPage } = options
  const maxPages = options.maxPages ?? MIN_ID_PULL_MAX_PAGES
  let minId = initialMinId || 0
  for (let page = 0; page < maxPages; page++) {
    const list = await fetchPage({ minId, size: pageSize })
    if (!list || list.length === 0) {
      return
    }
    const validIds = list.map(record => record.id).filter((id): id is number => id != null)
    const nextMinId = validIds.length > 0 ? Math.max(...validIds) : undefined
    if (await applyPage(list, nextMinId) === false) {
      return
    }
    if (nextMinId == null || nextMinId <= minId) {
      return
    }
    minId = nextMinId
  }
  console.warn('[IM pull] runMinIdPull 达到单轮翻页上限，提前结束本轮')
}
