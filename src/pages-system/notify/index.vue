<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="站内信管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view v-if="hasAccessByCodes(['system:notify-template:query', 'system:notify-message:query'])" class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab v-if="hasAccessByCodes(['system:notify-template:query'])" name="0" title="站内信模板" />
        <wd-tab v-if="hasAccessByCodes(['system:notify-message:query'])" name="1" title="站内信消息" />
      </wd-tabs>
    </view>
    <wd-empty v-else icon="content" tip="暂无访问权限" />
    <!-- 列表内容 -->
    <TemplateList v-if="tabType === 'template' && hasAccessByCodes(['system:notify-template:query'])" class="min-h-0 flex-1" />
    <MessageList v-if="tabType === 'message' && hasAccessByCodes(['system:notify-message:query'])" class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import MessageList from './components/message-list.vue'
import TemplateList from './components/template-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const tabTypes: string[] = ['template', 'message']
const tabIndex = ref('0')
const tabType = computed<string>(() => tabTypes[Number(tabIndex.value)])

/** Tab 切换 */
function handleTabChange({ name }: { name: string }) {
  tabIndex.value = name
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>
