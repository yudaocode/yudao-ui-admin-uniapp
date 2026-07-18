<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="查找聊天内容" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <!-- 历史消息 -->
    <MessageHistory
      :key="`${accountId}:${conversationType}:${targetId}`"
      :type="conversationType"
      :target-id="targetId"
      :title="title"
      :active="active"
      @locate="locateMessage"
    />
  </view>
</template>

<script lang="ts" setup>
import { onHide, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { ImConversationType } from '@/pages-im/utils/constants'
import { buildConversationMessageUrl } from '@/pages-im/utils/conversation'
import { navigateBackPlus } from '@/utils'
import { useUserStore } from '@/store/user'
import MessageHistory from '../message/components/message-history.vue'

const props = defineProps<{
  targetId?: number | string
  title?: string
  type?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const active = ref(true) // 页面是否显示
const accountId = computed(() => useUserStore().userInfo.userId) // 当前账号编号
const conversationType = computed(() => Number(props.type || ImConversationType.PRIVATE)) // 会话类型
const targetId = computed(() => Number(props.targetId)) // 会话目标编号

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/conversation/index')
}

/** 定位聊天消息 */
function locateMessage(messageId: number) {
  uni.navigateTo({
    url: buildConversationMessageUrl({
      type: conversationType.value,
      targetId: targetId.value,
      locateMessageId: messageId,
    }),
  })
}

onShow(() => {
  active.value = true
})

onHide(() => {
  active.value = false
})
</script>
