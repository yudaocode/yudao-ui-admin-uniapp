<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="定时任务"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="定时任务" />
        <wd-tab title="调度日志" />
      </wd-tabs>
    </view>
    <!-- 列表内容 -->
    <JobList v-show="tabType === 'job'" @view-log="handleViewLog" />
    <LogList v-show="tabType === 'log'" :job-id="selectedJobId" />
  </view>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import JobList from './components/job-list.vue'
import LogList from './components/log-list.vue'

const props = defineProps<{
  tab?: string
  jobId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['job', 'log']
const tabIndex = ref(0)
const tabType = computed<string>(() => tabTypes[tabIndex.value])
const selectedJobId = ref<number>() // 选中的任务 ID

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 查看调度日志 */
function handleViewLog(jobId: number) {
  selectedJobId.value = jobId
  tabIndex.value = 1 // 切换到调度日志 tab
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 初始化 */
onMounted(() => {
  // 支持通过 URL 参数切换到日志 tab
  if (props.tab === 'log') {
    tabIndex.value = 1
    if (props.jobId) {
      selectedJobId.value = Number(props.jobId)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
