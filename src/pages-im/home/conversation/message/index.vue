<template>
  <MessagePanel
    v-if="isTargetValid"
    :conversation-type="conversationType"
    :target-id="targetId"
    :locate-message-id="locateMessageId"
    :mention-message-id="mentionMessageId"
    :active="active"
  />
</template>

<script lang="ts" setup>
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ImConversationType } from '@/pages-im/utils/constants'
import MessagePanel from './components/message-panel.vue'

const props = defineProps<{
  targetId?: number | string
  type?: number | string
  locateMessageId?: number | string
  mentionMessageId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const active = ref(false) // 页面是否可见
const invalidTargetPrompted = ref(false) // 是否已经提示无效会话参数
const conversationType = computed(() => Number(props.type || ImConversationType.PRIVATE)) // 会话类型
const targetId = computed(() => Number(props.targetId)) // 会话目标编号
const isTargetValid = computed(() => Number.isFinite(targetId.value) && targetId.value > 0) // 会话目标是否有效
const locateMessageId = computed(() => props.locateMessageId ? Number(props.locateMessageId) : undefined) // 定位消息编号
const mentionMessageId = computed(() => props.mentionMessageId ? Number(props.mentionMessageId) : undefined) // @ 消息编号

/** 进入页面 */
onShow(() => {
  active.value = true
  if (!isTargetValid.value && !invalidTargetPrompted.value) {
    invalidTargetPrompted.value = true
    toast.show('会话参数不完整')
  }
})

/** 离开页面 */
onHide(() => {
  active.value = false
})

/** 卸载页面 */
onUnload(() => {
  active.value = false
})
</script>
