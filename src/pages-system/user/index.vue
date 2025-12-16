<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="用户管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm
      :search-params="queryParams"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 用户列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white"
        @click="handleDetail(item)"
      >
        <view class="relative p-24rpx">
          <view class="absolute right-24rpx top-24rpx">
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="flex items-center gap-16rpx">
            <wd-img
              v-if="item.avatar"
              :src="item.avatar"
              :width="40"
              :height="40"
              mode="aspectFill"
              round
            />
            <view
              v-else
              class="h-80rpx w-80rpx flex items-center justify-center rounded-full bg-[#1890ff] text-32rpx text-white"
            >
              {{ (item.nickname || item.username)?.charAt(0) }}
            </view>
            <view>
              <view class="text-32rpx text-[#333] font-semibold">
                {{ item.nickname || item.username }}
              </view>
              <view class="text-24rpx text-[#999]">
                {{ item.deptName || '未分配部门' }}
              </view>
            </view>
          </view>
          <view v-if="item.loginDate" class="absolute bottom-24rpx right-24rpx text-22rpx text-[#999]">
            登录时间：{{ formatDate(item.loginDate) }}
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无用户数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['system:user:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SearchFormData } from './components/search-form.vue'
import type { User } from '@/api/system/user'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { onMounted, reactive, ref } from 'vue'
import { getUserPage } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const total = ref(0)
const list = ref<User[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  username: undefined as string | undefined,
  nickname: undefined as string | undefined,
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询用户列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getUserPage(queryParams)
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
  queryParams.username = data?.username
  queryParams.nickname = data?.nickname
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

/** 新增用户 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-system/user/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: User) {
  uni.navigateTo({
    url: `/pages-system/user/detail/index?id=${item.id}`,
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
