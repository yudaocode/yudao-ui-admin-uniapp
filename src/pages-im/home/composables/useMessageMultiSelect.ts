import type { Message } from '../types'
import { computed, reactive } from 'vue'

/**
 * 消息多选模式
 *
 * 模块级单例 reactive state；聊天页内的消息气泡、操作栏和转发弹窗共享。
 */
const state = reactive({
  active: false,
  selectedClientMessageIds: [] as string[], // 已选客户端消息编号，按选中顺序保序
})

/** 已选 clientMessageId 集合 */
const selectedIdSet = computed(() => new Set(state.selectedClientMessageIds))

/** 进入多选模式，可附带初始勾选项 */
function enter(initialMessage?: Message) {
  state.active = true
  state.selectedClientMessageIds = initialMessage ? [initialMessage.clientMessageId] : []
}

/** 退出多选模式 */
function exit() {
  state.active = false
  state.selectedClientMessageIds = []
}

/** 切换某条消息的选中态 */
function toggle(message: Message) {
  const ids = state.selectedClientMessageIds
  const index = ids.indexOf(message.clientMessageId)
  if (index >= 0) {
    ids.splice(index, 1)
  } else {
    ids.push(message.clientMessageId)
  }
}

export function useMessageMultiSelect() {
  return { state, selectedIdSet, enter, exit, toggle }
}
