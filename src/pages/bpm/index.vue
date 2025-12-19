<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="审批"
      placeholder safe-area-inset-top fixed
    />

    <!-- Tabs 区域 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="待办任务" />
        <wd-tab title="已办任务" />
        <wd-tab title="我的流程" />
        <wd-tab title="抄送我的" />
      </wd-tabs>
    </view>
    <!-- 列表内容 -->
    <TodoList v-show="tabType === 'todo'" :active="tabType === 'todo'" />
    <DoneList v-show="tabType === 'done'" :active="tabType === 'done'" />
    <MyList v-show="tabType === 'my'" :active="tabType === 'my'" />
    <CopyList v-show="tabType === 'copy'" :active="tabType === 'copy'" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getAndClearTabParams } from '@/utils/url'
import CopyList from './components/copy-list.vue'
import DoneList from './components/done-list.vue'
import MyList from './components/my-list.vue'
import TodoList from './components/todo-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['todo', 'done', 'my', 'copy']
const tabIndex = ref(0)
const tabType = computed<string>(() => tabTypes[tabIndex.value])

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 初始化：根据 tab 参数设置默认 tab */
onShow(() => {
  // 从 globalData 获取参数（switchTab 跳转时使用）
  const tabParams = getAndClearTabParams()
  if (tabParams?.tab) {
    const index = tabTypes.indexOf(tabParams.tab)
    if (index !== -1) {
      tabIndex.value = index
    }
  }
})
</script>
