<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="私聊消息详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="消息编号" :value="formData?.id || '-'" />
        <wd-cell title="客户端消息号" :value="formData?.clientMessageId || '-'" />
        <wd-cell title="发送人" :value="formData?.senderNickname || (formData ? `用户 ${formData.senderId}` : '-')" />
        <wd-cell title="接收人" :value="formData?.receiverNickname || (formData ? `用户 ${formData.receiverId}` : '-')" />
        <wd-cell title="消息类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.IM_CONTENT_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.IM_MESSAGE_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="回执状态">
          <dict-tag
            v-if="formData?.receiptStatus != null"
            :type="DICT_TYPE.IM_MESSAGE_RECEIPT_STATUS"
            :value="formData.receiptStatus"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="发送时间" :value="formatDateTime(formData?.sendTime) || '-'" />
      </wd-cell-group>

      <!-- 消息内容 -->
      <view class="mt-20rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#999]">
          消息内容
        </view>
        <view v-if="formData" class="inline-block max-w-full rounded-12rpx bg-[#f7f8fa] p-20rpx text-28rpx text-[#333]">
          <MessageContent
            :type="formData.type"
            :content="formData.content"
            :conversation-type="ImConversationType.PRIVATE"
          />
        </view>
      </view>

      <!-- 原始内容，便于排查暂未识别的扩展消息 -->
      <view class="mt-20rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#999]">
          原始内容
        </view>
        <text selectable class="whitespace-pre-wrap break-all text-24rpx text-[#666] leading-36rpx">{{ formatJson(formData?.content, '-') }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerPrivateMessageVO } from '@/api/im/manager/message/private'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getManagerPrivateMessage } from '@/api/im/manager/message/private'
import MessageContent from '@/pages-im/home/components/message-content.vue'
import { ImConversationType } from '@/pages-im/utils/constants'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatJson } from '@/utils/format'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<ImManagerPrivateMessageVO>() // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/message/private/index')
}

/** 加载私聊消息详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getManagerPrivateMessage(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 初始化私聊消息详情 */
onMounted(() => {
  getDetail()
})
</script>
