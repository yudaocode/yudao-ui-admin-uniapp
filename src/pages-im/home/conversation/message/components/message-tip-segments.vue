<template>
  <template v-for="(segment, index) in segments" :key="index">
    <text
      :class="segment.type !== 'text' ? 'text-[#576b95]' : ''"
      @tap.stop="handleSegmentTap(segment)"
    >
      {{ segment.text }}
    </text>
  </template>
</template>

<script lang="ts" setup>
import type { TipSegment } from '@/pages-im/utils/message'
import { IM_AT_ALL_USER_ID } from '@/pages-im/utils/constants'
import { openUrl } from '@/utils/url'

defineProps<{
  segments: TipSegment[] // 消息提示分段
}>()

const emit = defineEmits<{
  'mention-click': [userId: number] // 点击用户分段
}>()

/** 点击消息提示分段 */
function handleSegmentTap(segment: TipSegment) {
  if (segment.type === 'link') {
    openUrl(segment.href)
  } else if (segment.type === 'mention' && segment.userId !== IM_AT_ALL_USER_ID) {
    emit('mention-click', segment.userId)
  }
}
</script>
