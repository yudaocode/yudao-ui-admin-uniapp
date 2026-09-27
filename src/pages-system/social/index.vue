<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="三方用户管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="三方应用" />
        <wd-tab v-if="hasAccessByCodes(['system:social-user:query'])" title="三方用户" />
      </wd-tabs>
    </view>

    <!-- 列表内容 -->
    <ClientList v-if="tabType === 'client'" class="min-h-0 flex-1" />
    <UserList v-if="tabType === 'user' && hasAccessByCodes(['system:social-user:query'])" class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import ClientList from './components/client-list.vue'
import UserList from './components/user-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['client', 'user']
const { hasAccessByCodes } = useAccess()
const tabIndex = ref(0)
const tabType = computed<string>(() => tabTypes[tabIndex.value])

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>
