<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="站内信管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="站内信模板" />
        <wd-tab title="站内信消息" />
      </wd-tabs>
    </view>
    <!-- 列表内容 -->
    <TemplateList v-show="tabType === 'template'" />
    <MessageList v-show="tabType === 'message'" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import MessageList from './components/message-list.vue'
import TemplateList from './components/template-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['template', 'message']
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

<style lang="scss" scoped>
</style>
