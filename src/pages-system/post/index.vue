<template>
  <view class="min-h-screen bg-[#f5f5f5]">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="岗位管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    >
      <template #right>
        <view class="flex items-center" @click="searchVisible = !searchVisible">
          <wd-icon name="search" size="20px" />
        </view>
      </template>
    </wd-navbar>

    <!-- 岗位列表 -->
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
              {{ item.name }}
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">岗位编码：</text>
            <text>{{ item.code }}</text>
          </view>
          <view v-if="item.remark" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">备注：</text>
            <text class="line-clamp-1">{{ item.remark }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无岗位数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <!-- 搜索弹窗 -->
    <SearchForm
      v-model="searchVisible"
      :search-params="queryParams"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 新增按钮 -->
    <view
      class="fixed bottom-100rpx right-32rpx z-10 h-100rpx w-100rpx flex items-center justify-center rounded-full bg-[#1890ff] shadow-lg"
      @click="handleAdd"
    >
      <wd-icon name="add" size="24px" color="#fff" />
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Post } from '@/api/system/post'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { onMounted, reactive, ref } from 'vue'
import { getPostPage } from '@/api/system/post'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const total = ref(0) // 列表的总页数
const list = ref<Post[]>([]) // 列表的数据
const loadMoreState = ref<LoadMoreState>('loading') // 加载更多状态
const searchVisible = ref(false) // 搜索弹窗
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  code: undefined as string | undefined,
  status: -1 as number, // -1 表示全部
})

/** 返回上一页 */
function handleBack() {
  uni.navigateBack()
}

/** 查询岗位列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getPostPage({
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
function handleQuery(data?: { name?: string, code?: string, status?: number }) {
  queryParams.name = data?.name
  queryParams.code = data?.code
  queryParams.status = data?.status ?? -1
  queryParams.pageNo = 1
  list.value = [] // 清空列表
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

/** 新增岗位 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-system/post/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: Post) {
  uni.navigateTo({
    url: `/pages-system/post/detail/index?id=${item.id}`,
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
