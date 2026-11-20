<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="审批"
      placeholder safe-area-inset-top fixed
    />

    <!-- Tabs 区域 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="待办任务" />
        <wd-tab title="待我修改" />
        <wd-tab title="已办任务" />
        <wd-tab title="我的流程" />
        <wd-tab title="抄送我的" />
      </wd-tabs>
    </view>
    <!-- 列表内容 -->
    <TodoList v-if="loadedTabs.has('todo')" v-show="tabType === 'todo'" class="min-h-0 flex-1" />
    <RevisionList v-if="loadedTabs.has('revision')" v-show="tabType === 'revision'" class="min-h-0 flex-1" />
    <DoneList v-if="loadedTabs.has('done')" v-show="tabType === 'done'" class="min-h-0 flex-1" />
    <MyList v-if="loadedTabs.has('my')" v-show="tabType === 'my'" class="min-h-0 flex-1" />
    <CopyList v-if="loadedTabs.has('copy')" v-show="tabType === 'copy'" class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, reactive, ref, watch } from 'vue'
import { getAndClearTabParams } from '@/utils/url'
import CopyList from './components/copy-list.vue'
import DoneList from './components/done-list.vue'
import MyList from './components/my-list.vue'
import RevisionList from './components/revision-list.vue'
import TodoList from './components/todo-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['todo', 'revision', 'done', 'my', 'copy']
const tabIndex = ref(0) // 当前选中的审批列表页签下标
const tabType = computed<string>(() => tabTypes[tabIndex.value])
const loadedTabs = reactive<Set<string>>(new Set()) // 已挂载过的 tab，挂载后保留以保持各列表状态

/** 挂载当前 tab 对应列表 */
watch(tabType, (type) => {
  loadedTabs.add(type)
}, { immediate: true })

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 初始化 */
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
