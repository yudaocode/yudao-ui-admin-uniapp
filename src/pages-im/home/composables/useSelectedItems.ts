import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'

/**
 * 三态选择面板的「已选数 + 已选项列表」派生
 *
 * - 三态优先级：hide > locked > disabled
 * - 顺序：lockedIds 在前，selectedIds 紧随
 */
export function useSelectedItems<T>(
  selectedIds: () => readonly number[],
  lockedIds: () => readonly number[],
  disabledIds: () => readonly number[],
  hideIds: () => readonly number[],
  byId: Ref<Map<number, T>> | ComputedRef<Map<number, T>>,
): {
  selectedCount: ComputedRef<number>
  selectedItems: ComputedRef<T[]>
} {
  const hideSet = computed(() => new Set(hideIds()))
  const disabledSet = computed(() => new Set(disabledIds()))
  const selectedCount = computed(() => {
    const merged = new Set<number>()
    for (const id of selectedIds()) {
      if (hideSet.value.has(id) || disabledSet.value.has(id)) {
        continue
      }
      merged.add(id)
    }
    // locked 仅被 hide 过滤；locked 胜过 disabled
    for (const id of lockedIds()) {
      if (hideSet.value.has(id)) {
        continue
      }
      merged.add(id)
    }
    return merged.size
  })
  const selectedItems = computed(() => {
    const seen = new Set<number>()
    const result: T[] = []
    for (const id of lockedIds()) {
      if (seen.has(id) || hideSet.value.has(id)) {
        continue
      }
      const item = byId.value.get(id)
      if (item) {
        seen.add(id)
        result.push(item)
      }
    }
    for (const id of selectedIds()) {
      if (seen.has(id) || disabledSet.value.has(id) || hideSet.value.has(id)) {
        continue
      }
      const item = byId.value.get(id)
      if (item) {
        seen.add(id)
        result.push(item)
      }
    }
    return result
  })
  return { selectedCount, selectedItems }
}
