<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="短剧制作管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="项目管理" />
        <wd-tab title="生成任务" />
      </wd-tabs>
    </view>

    <!-- 项目管理 / 生成任务 -->
    <ProjectList v-if="tabIndex === 0" />
    <TaskList v-else />
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import ProjectList from './components/project-list.vue'
import TaskList from './components/task-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabIndex = ref(0) // 当前 Tab：0 项目管理、1 生成任务

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>
