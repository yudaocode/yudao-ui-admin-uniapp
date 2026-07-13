export interface PullCursor {
  lastUpdateTime?: number
  lastId?: number
}

/** 按更新时间和编号增量拉取状态记录 */
export async function runIncrementalPull<T extends { id: number, updateTime?: number }>(options: {
  cursor: PullCursor
  pageSize: number
  fetchPage: (cursor: PullCursor) => Promise<T[]>
  applyPage: (list: T[]) => Promise<void>
  persistCursor: (cursor: PullCursor) => Promise<void>
  isActive?: () => boolean
  maxPages?: number
}) {
  const isActive = options.isActive || (() => true)
  const cursor = { ...options.cursor }
  for (let page = 0; page < (options.maxPages || 50) && isActive(); page++) {
    const list = await options.fetchPage(cursor)
    if (!list.length || !isActive()) {
      break
    }
    await options.applyPage(list)
    if (!isActive()) {
      break
    }
    const last = list[list.length - 1]
    if (last.updateTime === cursor.lastUpdateTime && last.id === cursor.lastId) {
      break
    }
    cursor.lastUpdateTime = last.updateTime
    cursor.lastId = last.id
    await options.persistCursor(cursor)
    if (list.length < options.pageSize) {
      break
    }
  }
  return cursor
}

/** 按最小编号增量拉取，直到服务端返回不足一页 */
export async function runMinIdPull<T extends { id?: number }>(options: {
  initialMinId: number
  pageSize: number
  fetchPage: (minId: number) => Promise<T[]>
  persistPage: (list: T[]) => Promise<void>
  persistCursor: (minId: number) => Promise<void>
  isActive?: () => boolean
  maxPages?: number
}) {
  const isActive = options.isActive || (() => true)
  let minId = options.initialMinId
  for (let page = 0; page < (options.maxPages || 50) && isActive(); page++) {
    const list = await options.fetchPage(minId)
    if (!list.length || !isActive()) {
      break
    }
    await options.persistPage(list)
    if (!isActive()) {
      break
    }
    const nextMinId = list.reduce((max, item) => Math.max(max, item.id || 0), minId)
    if (nextMinId <= minId) {
      break
    }
    minId = nextMinId
    await options.persistCursor(minId)
    if (list.length < options.pageSize) {
      break
    }
  }
  return minId
}
