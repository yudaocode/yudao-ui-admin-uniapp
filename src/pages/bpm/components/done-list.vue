<template>
  <view>
    <!-- 搜索组件 -->
    <DoneSearchForm @search="handleSearch" @reset="handleReset" />

    <view class="bpm-list">
      <view
        v-for="item in list"
        :key="item.id"
        class="bpm-card"
        @click="handleDetail(item)"
      >
        <view class="bpm-card-content">
          <view class="bpm-card-header">
            <view class="bpm-card-title">
              {{ item.processInstance?.name }}
            </view>
            <dict-tag :type="DICT_TYPE.BPM_TASK_STATUS" :value="item.status" />
          </view>
          <view v-if="item.processInstance?.summary?.length" class="bpm-summary">
            <view v-for="(s, idx) in item.processInstance.summary" :key="idx" class="bpm-summary-item">
              <text class="text-[#999]">{{ s.key }}：</text>
              <text>{{ s.value }}</text>
            </view>
          </view>
          <view class="bpm-card-info">
            <view class="bpm-user">
              <view class="bpm-avatar">
                {{ item.processInstance?.startUser?.nickname?.[0] || '?' }}
              </view>
              <text class="bpm-nickname">{{ item.processInstance?.startUser?.nickname }}</text>
            </view>
            <text class="bpm-time">{{ formatDateTime(item.createTime) }}</text>
          </view>
        </view>
      </view>

      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="bpm-empty">
        <wd-status-tip image="content" tip="暂无已办任务" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Task } from '@/api/bpm/task'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { onMounted, ref, watch } from 'vue'
import { getTaskDonePage } from '@/api/bpm/task'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import DoneSearchForm from './done-search-form.vue'
import '../styles/index.scss'

const props = defineProps<{
  active?: boolean
}>()

const total = ref(0)
const list = ref<Task[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const isFirstLoad = ref(true)
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})

/** 查询列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getTaskDonePage(queryParams.value)
    list.value = [...list.value, ...data.list]
    total.value = data.total
    loadMoreState.value = list.value.length >= total.value ? 'finished' : 'loading'
  } catch {
    queryParams.value.pageNo = queryParams.value.pageNo > 1 ? queryParams.value.pageNo - 1 : 1
    loadMoreState.value = 'error'
  }
}

/** 加载更多 */
function loadMore() {
  if (loadMoreState.value === 'finished') {
    return
  }
  queryParams.value.pageNo++
  getList()
}

/** 搜索 */
function handleSearch(data?: Record<string, any>) {
  queryParams.value = {
    ...data,
    pageNo: 1,
    pageSize: queryParams.value.pageSize,
  }
  list.value = []
  getList()
}

/** 重置 */
function handleReset() {
  handleSearch()
}

/** 查看详情 */
function handleDetail(item: Task) {
  uni.navigateTo({ url: `/pages-bpm/processInstance/detail/index?id=${item.processInstance.id}` })
}

/** 触底加载更多 */
onReachBottom(() => {
  loadMore()
})

/** 监听激活状态，刷新数据 */
watch(() => props.active, (val) => {
  if (val && !isFirstLoad.value) {
    queryParams.value.pageNo = 1
    list.value = []
    getList()
  }
})

/** 初始化 */
onMounted(() => {
  getList()
  isFirstLoad.value = false
})
</script>
