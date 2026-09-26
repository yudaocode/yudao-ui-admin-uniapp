<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="短信管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view v-if="hasAccessByCodes(['system:sms-channel:query', 'system:sms-template:query', 'system:sms-log:query'])" class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab v-if="hasAccessByCodes(['system:sms-channel:query'])" name="0" title="短信渠道" />
        <wd-tab v-if="hasAccessByCodes(['system:sms-template:query'])" name="1" title="短信模板" />
        <wd-tab v-if="hasAccessByCodes(['system:sms-log:query'])" name="2" title="短信日志" />
      </wd-tabs>
    </view>
    <wd-empty v-else icon="content" tip="暂无访问权限" />
    <!-- 列表内容 -->
    <ChannelList v-if="tabType === 'channel' && hasAccessByCodes(['system:sms-channel:query'])" class="min-h-0 flex-1" />
    <TemplateList v-if="tabType === 'template' && hasAccessByCodes(['system:sms-template:query'])" class="min-h-0 flex-1" />
    <LogList v-if="tabType === 'log' && hasAccessByCodes(['system:sms-log:query'])" class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import ChannelList from './channel/components/list.vue'
import LogList from './log/components/list.vue'
import TemplateList from './template/components/list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const tabTypes: string[] = ['channel', 'template', 'log']
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
