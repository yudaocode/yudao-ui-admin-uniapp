<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="盘点方案"
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
      empty-view-text="暂无盘点方案"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-6rpx truncate text-26rpx text-[#666]">
                  {{ item.name || '-' }}
                </view>
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盘点类型：</text>
              <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="item.type" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">计划时间：</text>
              <text class="min-w-0 flex-1 truncate">{{ getPlanTimeText(item) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盲盘：</text>
              <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(item.blindFlag))" />
              <text class="mx-16rpx text-[#ddd]">|</text>
              <text class="mr-8rpx shrink-0 text-[#999]">冻结库存：</text>
              <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(item.frozen))" />
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
      v-if="hasAccessByCodes(['mes:wm-stock-taking-plan:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { StockTakingPlan } from '@/api/mes/wm/stocktaking/plan'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getStockTakingPlanPage } from '@/api/mes/wm/stocktaking/plan'
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
const list = ref<StockTakingPlan[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<StockTakingPlan>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 计划时间展示 */
function getPlanTimeText(item: StockTakingPlan) {
  const start = formatDateTime(item.startTime)
  const end = formatDateTime(item.endTime)
  if (!start && !end) {
    return '-'
  }
  return `${start || '-'} ~ ${end || '-'}`
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getStockTakingPlanPage({
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
  uni.navigateTo({ url: '/pages-mes/wm/stocktaking/plan/form/index' })
}

/** 查看详情 */
function handleDetail(item: StockTakingPlan) {
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/plan/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:stocktaking:plan:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:stocktaking:plan:reload', reload)
})
</script>
