<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="通知公告管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm
      :search-params="queryParams"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 通知公告列表 -->
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
              {{ item.title }}
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">公告内容：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.content }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">公告类型：</text>
            <dict-tag :type="DICT_TYPE.SYSTEM_NOTICE_TYPE" :value="item.type" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text class="line-clamp-1">{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无通知公告数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['system:notice:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SearchFormData } from './components/search-form.vue'
import type { Notice } from '@/api/system/notice'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { onMounted, reactive, ref } from 'vue'
import { getNoticePage } from '@/api/system/notice'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const total = ref(0)
const list = ref<Notice[]>([])
const loadMoreState = ref<LoadMoreState>('loading') // 加载更多状态

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined as string | undefined,
  status: -1 as number, // -1 表示全部
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询通知公告列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getNoticePage({
      ...queryParams,
      status: queryParams.status === -1 ? undefined : queryParams.status,
    })
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
  queryParams.title = data?.title
  queryParams.status = data?.status ?? -1
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

/** 新增通知公告 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-system/notice/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: Notice) {
  uni.navigateTo({
    url: `/pages-system/notice/detail/index?id=${item.id}`,
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
