<template>
  <wd-tabbar
    v-model="currentTab"
    :active-color="activeColor"
    inactive-color="#8a8a8a"
    safe-area-inset-bottom
    bordered
  >
    <wd-tabbar-item
      v-for="tab in tabs"
      :key="tab.key"
      :name="tab.key"
      :title="tab.title"
      :icon="tab.icon"
      :value="tab.key === 'conversation' ? messageBadge : contactBadge"
      @click="handleTabClick(tab.key)"
    />
  </wd-tabbar>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useConversationStore } from '../store/conversationStore'
import { useImRuntimeStore } from '../store/runtimeStore'
import { useImUiStore } from '../store/uiStore'

type ImHomeTab = 'conversation' | 'contact'

const props = defineProps<{
  active: ImHomeTab
}>()

const activeColor = '#1677ff' // 选中色
const tabs: Array<{ key: ImHomeTab, title: string, icon: string }> = [ // 底部导航配置
  { key: 'conversation', title: '消息', icon: 'message' },
  { key: 'contact', title: '通讯录', icon: 'user' },
]
const currentTab = ref<ImHomeTab>(props.active) // 当前导航项
const { getTotalUnreadCount } = storeToRefs(useConversationStore())
const { contactUnread } = storeToRefs(useImRuntimeStore())
const uiStore = useImUiStore()

const messageBadge = computed<number | string | undefined>(() => { // 消息徽标
  if (getTotalUnreadCount.value <= 0) {
    return undefined
  }
  return getTotalUnreadCount.value > 99 ? '99+' : getTotalUnreadCount.value
})
const contactBadge = computed<number | string | undefined>(() => { // 通讯录徽标
  if (contactUnread.value <= 0) {
    return undefined
  }
  return contactUnread.value > 99 ? '99+' : contactUnread.value
})

/** 切换 IM 一级页面 */
function handleTabClick(tab: ImHomeTab) {
  if (tab === props.active) {
    if (tab === 'conversation') {
      uiStore.requestNextUnreadJump()
    }
    return
  }
  uni.redirectTo({
    url: tab === 'conversation'
      ? '/pages-im/home/conversation/index'
      : '/pages-im/home/contact/index',
  })
}

/** 同步当前导航项 */
watch(() => props.active, value => currentTab.value = value)

// #ifdef H5
const defaultDocumentTitle = document.title.replace(/^\(\d+\+?\)\s*/, '') // 默认浏览器标题
/** 同步浏览器未读标题 */
watch(getTotalUnreadCount, (count) => {
  document.title = count > 0 ? `(${count > 99 ? '99+' : count}) ${defaultDocumentTitle}` : defaultDocumentTitle
}, { immediate: true })

/** 恢复浏览器标题 */
onUnmounted(() => {
  document.title = defaultDocumentTitle
})
// #endif
</script>
