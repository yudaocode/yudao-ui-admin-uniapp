<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="OAuth2.0 管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view v-if="hasAccessByCodes(['system:oauth2-client:query', 'system:oauth2-token:query'])" class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab v-if="hasAccessByCodes(['system:oauth2-client:query'])" name="0" title="应用管理" />
        <wd-tab v-if="hasAccessByCodes(['system:oauth2-token:query'])" name="1" title="令牌管理" />
      </wd-tabs>
    </view>

    <wd-empty v-else icon="content" tip="暂无访问权限" />
    <!-- 列表内容 -->
    <ClientList v-if="tabType === 'client' && hasAccessByCodes(['system:oauth2-client:query'])" class="min-h-0 flex-1" />
    <TokenList v-if="tabType === 'token' && hasAccessByCodes(['system:oauth2-token:query'])" class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import ClientList from './components/client-list.vue'
import TokenList from './components/token-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const tabTypes: string[] = ['client', 'token']
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
