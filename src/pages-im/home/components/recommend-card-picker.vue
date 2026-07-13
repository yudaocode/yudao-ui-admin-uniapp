<template>
  <ForwardPicker v-model="visible" @confirm="handleConfirm" />
</template>

<script lang="ts" setup>
import type { ConversationDO } from '@/pages-im/home/db'
import type { ImCardMessage } from '@/pages-im/utils/message'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed } from 'vue'
import { sendGroupMessage } from '@/api/im/message/group'
import { sendPrivateMessage } from '@/api/im/message/private'
import { generateClientMessageId, serializeMessage } from '@/pages-im/utils/message'
import { ImConversationType, ImMessageType } from '@/utils/constants'
import ForwardPicker from '../chat/components/forward-picker.vue'

const props = defineProps<{
  modelValue: boolean // 是否显示
  card: ImCardMessage // 待推荐名片
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const toast = useToast()
const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

/** 发送名片到选中会话 */
async function handleConfirm(targets: ConversationDO[]) {
  const content = serializeMessage(props.card)
  await Promise.all(targets.map(target => target.type === ImConversationType.GROUP
    ? sendGroupMessage({
        clientMessageId: generateClientMessageId(),
        groupId: target.targetId,
        type: ImMessageType.CARD,
        content,
      })
    : sendPrivateMessage({
        clientMessageId: generateClientMessageId(),
        receiverId: target.targetId,
        type: ImMessageType.CARD,
        content,
      })))
  toast.success('名片已发送')
}
</script>
