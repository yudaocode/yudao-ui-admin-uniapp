<template>
  <MessageBubble
    :type="type ?? -1"
    :content="content"
    :conversation-type="conversationType"
    :mentions="mentions"
    :upload-progress="uploadProgress"
    embedded
    @material-click="emit('material-click', $event)"
    @open-merge="emit('merge-click', $event)"
    @click-card="emit('card-click', $event)"
    @mention-click="emit('mention-click', $event)"
  />
</template>

<script lang="ts" setup>
import type { CardMessage, MaterialMessage, MentionCandidate } from '@/pages-im/utils/message'
import MessageBubble from '@/pages-im/home/conversation/message/components/message-bubble.vue'

defineProps<{
  type?: number // 消息类型 ImMessageType
  content: string // 消息内容（JSON 字符串）
  conversationType?: number // 当前会话类型
  mentions?: MentionCandidate[] // 文本中的 @ 候选
  uploadProgress?: number // 媒体上传进度
}>()

const emit = defineEmits<{
  'material-click': [payload: MaterialMessage] // 点击频道素材
  'merge-click': [content: string] // 点击合并转发
  'card-click': [payload: CardMessage] // 点击名片
  'mention-click': [userId: number] // 点击 @ 用户
}>()
</script>
