<template>
  <view
    class="flex shrink-0 items-center justify-around border-t border-t-[#eee] bg-white py-24rpx pb-[calc(24rpx+env(safe-area-inset-bottom))]"
  >
    <text class="text-28rpx text-[#666]" @click="multiSelect.exit()">取消</text>
    <text
      class="text-28rpx"
      :class="selectedCount ? 'text-[#1677ff]' : 'text-[#ccc]'"
      @click="handleForward"
    >
      转发{{ selectedCount ? `(${selectedCount})` : '' }}
    </text>
    <text
      class="text-28rpx"
      :class="selectedCount ? 'text-[#fa5151]' : 'text-[#ccc]'"
      @click="handleDelete"
    >
      删除
    </text>
  </view>

  <wd-action-sheet
    v-model="forwardActionVisible"
    root-portal
    :actions="forwardActions"
    @select="handleForwardAction"
  />
</template>

<script lang="ts" setup>
import type { Message } from '../../../types'
import { computed, ref } from 'vue'
import { ImForwardMode, isNormalMessage } from '@/pages-im/utils/constants'
import { useMessageMultiSelect } from '../../../composables/useMessageMultiSelect'

const props = defineProps<{
  messages: Message[] // 当前会话消息，最新消息在前
}>()

const emit = defineEmits<{
  forward: [messages: Message[], merge: boolean] // 转发已选消息
  delete: [messages: Message[]] // 删除已选消息
}>()

const multiSelect = useMessageMultiSelect()
const forwardActionVisible = ref(false) // 转发方式菜单显示状态
const forwardActions = [ // 转发方式菜单项
  { name: '逐条转发', value: ImForwardMode.SINGLE },
  { name: '合并转发', value: ImForwardMode.MERGE },
]
const selectedCount = computed(() => multiSelect.state.selectedClientMessageIds.length) // 已选消息数量

/** 获取当前会话内已选消息，并恢复为正序 */
function getSelectedMessages() {
  const selectedIdSet = multiSelect.selectedIdSet.value
  return props.messages
    .filter(message => selectedIdSet.has(message.clientMessageId) && isNormalMessage(message.type))
    .reverse()
}

/** 转发已选消息 */
function handleForward() {
  const messages = getSelectedMessages()
  if (messages.length === 0) {
    return
  }
  if (messages.length === 1) {
    emit('forward', messages, false)
    return
  }
  forwardActionVisible.value = true
}

/** 选择转发方式 */
function handleForwardAction({ item }: { item: { value: string } }) {
  const messages = getSelectedMessages()
  if (messages.length > 0) {
    emit('forward', messages, item.value === ImForwardMode.MERGE)
  }
}

/** 删除已选消息 */
function handleDelete() {
  const messages = getSelectedMessages()
  if (messages.length > 0) {
    emit('delete', messages)
  }
}
</script>
