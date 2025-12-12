<template>
  <view class="min-h-screen bg-[#f5f5f5]">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="审批"
      placeholder safe-area-inset-top fixed
    >
      <template #right>
        <view class="flex items-center" @click="searchVisible = !searchVisible">
          <wd-icon name="search" size="20px" />
        </view>
      </template>
    </wd-navbar>

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
    <TodoList
      v-show="tabType === 'todo'"
      :search-visible="searchVisible && tabType === 'todo'"
      @update:search-visible="searchVisible = $event"
    />
    <DoneList
      v-show="tabType === 'done'"
      :search-visible="searchVisible && tabType === 'done'"
      @update:search-visible="searchVisible = $event"
    />
    <MyList
      v-show="tabType === 'my'"
      :search-visible="searchVisible && tabType === 'my'"
      @update:search-visible="searchVisible = $event"
    />
    <CopyList
      v-show="tabType === 'copy'"
      :search-visible="searchVisible && tabType === 'copy'"
      @update:search-visible="searchVisible = $event"
    />
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
const searchVisible = ref(false)

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  searchVisible.value = false
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
