<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="频道消息详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="消息编号" :value="formData?.id || '-'" />
        <wd-cell title="所属频道" :value="formData?.channelName || '-'" />
        <wd-cell title="素材封面" center>
          <wd-img
            v-if="formData?.materialCoverUrl"
            :src="formData.materialCoverUrl"
            width="120rpx"
            height="120rpx"
            radius="12rpx"
            mode="aspectFill"
            enable-preview
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="素材标题" :value="formData?.materialTitle || '-'" />
        <wd-cell title="消息类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.IM_CONTENT_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="接收范围" :value="receiverText" />
        <wd-cell title="发送时间" :value="formatDateTime(formData?.sendTime) || '-'" />
      </wd-cell-group>

      <!-- 接收用户 -->
      <view v-if="formData?.receiverUserIds?.length" class="mt-20rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#999]">
          接收用户
        </view>
        <view
          v-for="userId in formData.receiverUserIds"
          :key="userId"
          class="mb-16rpx flex items-center gap-20rpx rounded-12rpx bg-[#f7f8fa] p-20rpx last:mb-0"
        >
          <wd-img
            v-if="userMap.get(userId)?.avatar"
            :src="userMap.get(userId)?.avatar"
            width="72rpx"
            height="72rpx"
            radius="50%"
            mode="aspectFill"
          />
          <view class="min-w-0 flex-1">
            <view class="line-clamp-1 text-28rpx text-[#333]">
              {{ userMap.get(userId)?.nickname || `用户 ${userId}` }}
            </view>
            <view class="mt-6rpx text-24rpx text-[#999]">
              编号：{{ userId }}
            </view>
          </view>
        </view>
      </view>

      <!-- 消息内容 -->
      <view class="mt-20rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#999]">
          消息内容
        </view>
        <view v-if="formData" class="inline-block max-w-full rounded-12rpx bg-[#f7f8fa] p-20rpx text-28rpx text-[#333]">
          <MessageContent
            :type="formData.type"
            :content="formData.content"
            :conversation-type="ImConversationType.CHANNEL"
          />
        </view>
      </view>

      <!-- 原始内容 -->
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
import type { ImManagerChannelMessageVO } from '@/api/im/manager/channel/message'
import type { User } from '@/api/system/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getManagerChannelMessage } from '@/api/im/manager/channel/message'
import { getSimpleUserList } from '@/api/system/user'
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
const formData = ref<ImManagerChannelMessageVO>() // 详情数据
const userMap = ref(new Map<number, User>()) // 接收用户映射
const receiverText = computed(() => formData.value?.receiverUserIds?.length
  ? `指定用户（${formData.value.receiverUserIds.length} 人）`
  : '全员') // 接收范围

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/channel/message/index')
}

/** 加载频道消息详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    const [message, users] = await Promise.all([
      getManagerChannelMessage(Number(props.id)),
      getSimpleUserList(),
    ])
    formData.value = message
    userMap.value = new Map(users.filter(user => user.id != null).map(user => [user.id!, user]))
  } finally {
    toast.close()
  }
}

/** 初始化频道消息详情 */
onMounted(() => {
  getDetail()
})
</script>
