<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="邮件管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view v-if="hasAccessByCodes(['system:mail-account:query', 'system:mail-template:query', 'system:mail-log:query'])" class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab v-if="hasAccessByCodes(['system:mail-account:query'])" name="0" title="邮箱账号" />
        <wd-tab v-if="hasAccessByCodes(['system:mail-template:query'])" name="1" title="邮件模板" />
        <wd-tab v-if="hasAccessByCodes(['system:mail-log:query'])" name="2" title="邮件日志" />
      </wd-tabs>
    </view>
    <wd-empty v-else icon="content" tip="暂无访问权限" />
    <!-- 列表内容 -->
    <AccountList v-if="tabType === 'account' && hasAccessByCodes(['system:mail-account:query'])" class="min-h-0 flex-1" />
    <TemplateList v-if="tabType === 'template' && hasAccessByCodes(['system:mail-template:query'])" class="min-h-0 flex-1" />
    <LogList v-if="tabType === 'log' && hasAccessByCodes(['system:mail-log:query'])" class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import AccountList from './account/components/list.vue'
import LogList from './log/components/list.vue'
import TemplateList from './template/components/list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const tabTypes: string[] = ['account', 'template', 'log']
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
