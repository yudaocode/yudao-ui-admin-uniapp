<template>
  <view>
    <!-- 搜索组件 -->
    <MySearchForm
      :search-params="queryParams"
      @search="handleSearch"
      @reset="handleReset"
    />

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
              {{ item.name }}
            </view>
            <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="item.status" />
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
                {{ userNickname?.[0] }}
              </view>
              <text class="bpm-nickname">{{ userNickname }}</text>
            </view>
            <text class="bpm-time">{{ formatDateTime(item.startTime) }}</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="bpm-empty">
        <wd-status-tip image="content" tip="暂无发起的流程" />
      </view>
      <!-- 加载更多 -->
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />

      <!-- 新增按钮 -->
      <!-- TODO @AI：换成 wd-fat：要注意，可能高度不对；晚点在改； -->
      <view
        class="fixed bottom-100rpx right-32rpx z-10 h-100rpx w-100rpx flex items-center justify-center rounded-full bg-[#1890ff] shadow-lg"
        @click="handleCreate"
      >
        <wd-icon name="add" size="24px" color="#fff" />
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MySearchFormData } from './my-search-form.vue'
import type { ProcessInstance } from '@/api/bpm/processInstance'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getProcessInstanceMyPage } from '@/api/bpm/processInstance'
import { useUserStore } from '@/store'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange, formatDateTime } from '@/utils/date'
import MySearchForm from './my-search-form.vue'
import './index.scss'

const props = defineProps<{
  active?: boolean
}>()

const userStore = useUserStore()
const userNickname = computed(() => userStore.userInfo?.nickname || '')

const total = ref(0)
const list = ref<ProcessInstance[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const isFirstLoad = ref(true)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  createTime: undefined as number[] | undefined,
  status: -1,
  categoryId: undefined as string | undefined,
})

/** 查询列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const params = {
      ...queryParams,
      status: queryParams.status === -1 ? undefined : queryParams.status,
      createTime: formatDateRange(queryParams.createTime as any),
    }
    const data = await getProcessInstanceMyPage(params)
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
function handleSearch(data?: MySearchFormData) {
  queryParams.name = data?.name
  queryParams.createTime = data?.createTime as any
  queryParams.status = data?.status ?? -1
  queryParams.categoryId = data?.categoryId
  queryParams.pageNo = 1
  list.value = []
  getList()
}

/** 重置 */
function handleReset() {
  handleSearch()
}

/** 查看详情 */
function handleDetail(item: ProcessInstance) {
  uni.navigateTo({ url: `/pages-bpm/processInstance/detail/index?id=${item.id}` })
}

/** 发起流程 */
function handleCreate() {
  uni.navigateTo({ url: '/pages-bpm/processInstance/create/index' })
}

/** 触底加载更多 */
onReachBottom(() => {
  loadMore()
})

/** 监听激活状态，刷新数据 */
watch(() => props.active, (val) => {
  if (val && !isFirstLoad.value) {
    queryParams.pageNo = 1
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
