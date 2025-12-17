<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="操作日志管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm
      :search-params="queryParams"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 操作日志列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="p-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <view class="text-32rpx text-[#333] font-semibold">
              {{ item.type }} / {{ item.subType }}
            </view>
            <dict-tag :type="DICT_TYPE.USER_TYPE" :value="item.userType" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">操作人：</text>
            <text class="line-clamp-1">{{ item.userName }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">操作内容：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.action }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">操作时间：</text>
            <text class="line-clamp-1">{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">业务编号：</text>
            <text class="line-clamp-1">{{ item.bizId }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">操作 IP：</text>
            <text class="line-clamp-1">{{ item.userIp }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无操作日志数据" />
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
import type { SearchFormData } from './modules/search-form.vue'
import type { OperateLog } from '@/api/system/operate-log'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { onMounted, reactive, ref } from 'vue'
import { getOperateLogPage } from '@/api/system/operate-log'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange, formatDateTime } from '@/utils/date'
import SearchForm from './modules/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const total = ref(0)
const list = ref<OperateLog[]>([])
const loadMoreState = ref<LoadMoreState>('loading') // 加载更多状态

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined as number | undefined,
  type: undefined as string | undefined,
  subType: undefined as string | undefined,
  bizId: undefined as number | undefined,
  action: undefined as string | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询操作日志列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const params: any = { ...queryParams }
    params.createTime = formatDateRange(queryParams.createTime)
    const data = await getOperateLogPage(params)
    list.value = [...list.value, ...data.list]
    total.value = data.total
    loadMoreState.value = list.value.length >= total.value ? 'finished' : 'loading'
  } catch {
    queryParams.pageNo = queryParams.pageNo > 1 ? queryParams.pageNo - 1 : 1
    loadMoreState.value = 'error'
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: SearchFormData) {
  queryParams.userId = data?.userId
  queryParams.type = data?.type
  queryParams.subType = data?.subType
  queryParams.bizId = data?.bizId
  queryParams.action = data?.action
  queryParams.createTime = data?.createTime
  queryParams.pageNo = 1
  list.value = []
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 加载更多 */
function loadMore() {
  if (loadMoreState.value === 'finished') {
    return
  }
  queryParams.pageNo++
  getList()
}

/** 查看详情 */
function handleDetail(item: OperateLog) {
  uni.navigateTo({
    url: `/pages-system/operate-log/detail/index?id=${item.id}`,
  })
}

/** 触底加载更多 */
onReachBottom(() => {
  loadMore()
})

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
</style>
