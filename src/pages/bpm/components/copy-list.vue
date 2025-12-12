<template>
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
            {{ item.processInstanceName }}
          </view>
          <wd-tag type="primary" plain>
            查看详情
          </wd-tag>
        </view>
        <view v-if="item.summary?.length" class="bpm-summary">
          <view v-for="(s, idx) in item.summary" :key="idx" class="bpm-summary-item">
            <text class="text-[#999]">{{ s.key }}：</text>
            <text>{{ s.value }}</text>
          </view>
        </view>
        <view class="bpm-card-info">
          <view class="bpm-user">
            <view class="bpm-avatar">
              {{ item.startUser.nickname?.[0] || '?' }}
            </view>
            <text class="bpm-nickname">{{ item.startUser.nickname }}</text>
          </view>
          <text class="bpm-time">{{ formatDateTime(item.createTime) }}</text>
        </view>
      </view>
    </view>

    <view v-if="loadMoreState !== 'loading' && list.length === 0" class="bpm-empty">
      <wd-status-tip image="content" tip="暂无抄送任务" />
    </view>
    <wd-loadmore
      v-if="list.length > 0"
      :state="loadMoreState"
      @reload="loadMore"
    />

    <!-- 搜索弹窗 -->
    <CopySearchForm
      v-model="searchPopupVisible"
      :search-params="queryParams"
      @search="handleSearch"
      @reset="handleReset"
    />
  </view>
</template>

<script lang="ts" setup>
import type { CopySearchFormData } from './copy-search-form.vue'
import type { ProcessInstanceCopy } from '@/api/bpm/processInstance'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { onMounted, reactive, ref, watch } from 'vue'
import { getProcessInstanceCopyPage } from '@/api/bpm/processInstance'
import { formatDateRange, formatDateTime } from '@/utils/date'
import CopySearchForm from './copy-search-form.vue'
import './index.scss'

const props = defineProps<{
  searchVisible?: boolean
}>()

const emit = defineEmits<{
  'update:searchVisible': [value: boolean]
}>()

const total = ref(0)
const list = ref<ProcessInstanceCopy[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const searchPopupVisible = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  processInstanceName: undefined as string | undefined,
  createTime: undefined as number[] | undefined,
})

/** 查询列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const params = {
      ...queryParams,
      createTime: formatDateRange(queryParams.createTime as any),
    }
    const data = await getProcessInstanceCopyPage(params)
    list.value = [...list.value, ...data.list]
    total.value = data.total
    loadMoreState.value = list.value.length >= total.value ? 'finished' : 'loading'
  } catch {
    queryParams.pageNo = queryParams.pageNo > 1 ? queryParams.pageNo - 1 : 1
    loadMoreState.value = 'error'
  }
}

/** 加载更多 */
function loadMore() {
  if (loadMoreState.value === 'finished') {
    return
  }
  queryParams.pageNo++
  getList()
}

/** 搜索 */
function handleSearch(data?: CopySearchFormData) {
  queryParams.processInstanceName = data?.processInstanceName
  queryParams.createTime = data?.createTime
  queryParams.pageNo = 1
  list.value = []
  getList()
}

/** 重置 */
function handleReset() {
  handleSearch()
}

/** 查看详情 */
function handleDetail(item: ProcessInstanceCopy) {
  uni.navigateTo({ url: `/pages-bpm/processInstance/detail/index?id=${item.processInstanceId}` })
}

/** 触底加载更多 */
onReachBottom(() => {
  loadMore()
})

watch(() => props.searchVisible, (val) => {
  searchPopupVisible.value = val ?? false
})

watch(searchPopupVisible, (val) => {
  emit('update:searchVisible', val)
})

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
