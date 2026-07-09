<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="盘点任务"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无盘点任务"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-6rpx truncate text-26rpx text-[#666]">
                  {{ item.name || '-' }}
                </view>
              </view>
              <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盘点类型：</text>
              <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="item.type" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盘点方案：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.planName || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盘点日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.takingDate) || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盘点人：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.userNickname || '-' }}</text>
            </view>
            <view class="text-26rpx text-[#999]">
              创建时间：{{ formatDateTime(item.createTime) || '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:wm-stock-taking-task:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { StockTakingTask } from '@/api/mes/wm/stocktaking/task'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getStockTakingPage } from '@/api/mes/wm/stocktaking/task'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<StockTakingTask[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<StockTakingTask>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getStockTakingPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/wm/stocktaking/task/form/index' })
}

/** 查看详情 */
function handleDetail(item: StockTakingTask) {
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/task/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:stocktaking:task:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:stocktaking:task:reload', reload)
})
</script>
