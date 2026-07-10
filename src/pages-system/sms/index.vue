<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="短信管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="短信渠道" />
        <wd-tab title="短信模板" />
        <wd-tab title="短信日志" />
      </wd-tabs>
    </view>
    <!-- 列表内容 -->
    <ChannelList v-show="tabType === 'channel'" class="min-h-0 flex-1" />
    <TemplateList v-show="tabType === 'template'" class="min-h-0 flex-1" />
    <LogList v-show="tabType === 'log'" class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
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

const tabTypes: string[] = ['channel', 'template', 'log']
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
