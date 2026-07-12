<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="聊天管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 分类切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="对话列表" />
        <wd-tab title="消息列表" />
      </wd-tabs>
    </view>

    <!-- 管理列表 -->
    <ConversationList v-if="tabIndex === 0" />
    <MessageList
      v-else
      :conversation-id="props.conversationId ? Number(props.conversationId) : undefined"
    />
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import ConversationList from './components/conversation-list.vue'
import MessageList from './components/message-list.vue'

const props = defineProps<{
  tab?: string
  conversationId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabIndex = ref(props.tab === 'message' ? 1 : 0) // 当前分类

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>
