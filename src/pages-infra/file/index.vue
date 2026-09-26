<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="文件管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view v-if="hasAccessByCodes(['infra:file:query', 'infra:file-config:query'])" class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab v-if="hasAccessByCodes(['infra:file:query'])" name="0" title="文件列表" />
        <wd-tab v-if="hasAccessByCodes(['infra:file-config:query'])" name="1" title="文件配置" />
      </wd-tabs>
    </view>
    <wd-empty v-else icon="content" tip="暂无访问权限" />
    <!-- 列表内容 -->
    <FileList v-if="tabType === 'file' && hasAccessByCodes(['infra:file:query'])" class="min-h-0 flex-1" />
    <ConfigList v-if="tabType === 'config' && hasAccessByCodes(['infra:file-config:query'])" class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import ConfigList from './components/config-list.vue'
import FileList from './components/file-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const tabTypes: string[] = ['file', 'config']
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
