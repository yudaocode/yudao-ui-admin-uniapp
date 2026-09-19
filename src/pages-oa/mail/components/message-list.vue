<template>
  <view v-if="list.length" class="mx-24rpx my-20rpx overflow-hidden rounded-20rpx bg-white">
    <view v-for="item in list" :key="item.id" class="flex gap-20rpx border-b border-[#f0f2f5] border-b-solid p-24rpx last:border-b-0" @click="emit('open', item)">
      <view class="relative mt-2rpx h-68rpx w-68rpx flex shrink-0 items-center justify-center rounded-full text-28rpx font-medium" :class="item.readStatus ? 'bg-[#f1f3f6] text-[#94a3b8]' : 'bg-[#edf4ff] text-[#4380d9]'">
        {{ getCorrespondent(item).charAt(0) }}
        <view v-if="!item.readStatus" class="absolute right-0 top-0 h-14rpx w-14rpx rounded-full bg-[#1677ff]" />
      </view>
      <view class="min-w-0 flex-1">
        <view class="mb-10rpx flex items-center justify-between gap-12rpx">
          <text class="min-w-0 flex-1 truncate text-28rpx" :class="item.readStatus ? 'text-[#64748b]' : 'text-[#1f2937] font-semibold'">{{ getCorrespondent(item) }}</text><text class="shrink-0 text-22rpx text-[#94a3b8]">{{ formatDate(item.receiveTime, 'MM-DD HH:mm') }}</text>
        </view>
        <view class="line-clamp-2 break-words text-26rpx text-[#475569] leading-40rpx">
          {{ item.subject || '（无主题）' }}
        </view>
        <view v-if="item.hasAttach" class="mt-10rpx flex items-center gap-6rpx text-22rpx text-[#94a3b8]">
          <wd-icon name="attach" size="24rpx" /><text>含附件</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MailMessage } from '@/api/oa/mail'
import { formatDate } from '@/utils/date'
import { OA_MAIL_FOLDER_KEY } from '../../utils/constants'

const props = defineProps<{ list: MailMessage[], folderKey: string }>()
const emit = defineEmits<{ open: [item: MailMessage] }>()

/** 获取列表中显示的联系人 */
function getCorrespondent(item: MailMessage) {
  if (props.folderKey === OA_MAIL_FOLDER_KEY.SENT || props.folderKey === OA_MAIL_FOLDER_KEY.DRAFTS)
    return item.recipients?.join('、') || '（无收件人）'
  const sender = item.sender || '-'
  return sender.replace(/<[^>]*>/g, '').replace(/^"|"$/g, '').trim() || sender
}
</script>
