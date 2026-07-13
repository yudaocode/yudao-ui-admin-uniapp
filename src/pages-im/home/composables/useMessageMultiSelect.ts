import type { Ref } from 'vue'
import { computed, ref } from 'vue'

interface SelectableMessage {
  id?: number
  clientMessageId?: string
}

/** 管理聊天消息的跨操作多选状态 */
export function useMessageMultiSelect<T extends SelectableMessage>(messages: Ref<T[]>) {
  const selectMode = ref(false) // 消息多选模式
  const selectedIds = ref<string[]>([]) // 已选消息标识
  const selectedIdSet = computed(() => new Set(selectedIds.value)) // 已选消息标识集合

  /** 获取消息唯一标识 */
  function messageKey(item: T) {
    return String(item.id || item.clientMessageId)
  }

  /** 切换消息选中状态 */
  function toggleSelect(item: T) {
    const key = messageKey(item)
    const index = selectedIds.value.indexOf(key)
    if (index >= 0) {
      selectedIds.value.splice(index, 1)
    } else {
      selectedIds.value.push(key)
    }
  }

  /** 进入消息多选模式 */
  function enterSelectMode(item: T) {
    selectMode.value = true
    selectedIds.value = [messageKey(item)]
  }

  /** 退出消息多选模式 */
  function exitSelectMode() {
    selectMode.value = false
    selectedIds.value = []
  }

  /** 获取当前选中的消息，并恢复为正序 */
  function getSelectedMessages() {
    return messages.value
      .filter(item => selectedIds.value.includes(messageKey(item)))
      .reverse()
  }

  return {
    selectMode,
    selectedIds,
    selectedIdSet,
    messageKey,
    toggleSelect,
    enterSelectMode,
    exitSelectMode,
    getSelectedMessages,
  }
}
