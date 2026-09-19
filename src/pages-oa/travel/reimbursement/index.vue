<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="差旅报销"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 报销列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无差旅报销"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-center justify-between gap-12rpx">
            <text class="line-clamp-1 min-w-0 flex-1 text-32rpx text-[#333] font-semibold">{{ item.no || '-' }}</text>
            <text v-if="item.status === OA_APPLY_STATUS.NOT_START" class="shrink-0 text-24rpx text-[#999]">未提交</text>
            <dict-tag v-else :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">出差事由：</text>
            <text class="line-clamp-1 min-w-0 flex-1">{{ item.reason || '-' }}</text>
          </view>
          <view v-if="item.travelApplyNo" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">关联出差：</text>
            <text>{{ item.travelApplyNo }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">出差日期：</text>
            <text>{{ formatDate(item.startTime) || '-' }} 至 {{ formatDate(item.endTime) || '-' }}</text>
            <text v-if="item.days != null" class="ml-16rpx text-[#999]">共 {{ item.days }} 天</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">报销金额：</text>
            <text class="text-[#fa541c] font-semibold">{{ item.totalPrice != null ? `${item.totalPrice} 元` : '-' }}</text>
            <text class="ml-16rpx mr-8rpx text-[#999]">支付状态：</text>
            <text :class="item.payStatus ? 'text-[#07c160]' : ''">{{ item.payStatus ? '已支付' : '未支付' }}</text>
          </view>
          <view class="flex items-center justify-between text-24rpx text-[#999]">
            <text>{{ item.creatorName || '-' }} · {{ item.deptName || '-' }}</text>
            <text>{{ formatDateTime(item.createTime) }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['oa:travel-reimbursement:save'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { TravelReimbursement } from '@/api/oa/travel-reimbursement'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getTravelReimbursementPage } from '@/api/oa/travel-reimbursement'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { OA_APPLY_STATUS } from '../../utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<TravelReimbursement[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询报销列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTravelReimbursementPage({
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

/** 新增报销 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/travel/reimbursement/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: TravelReimbursement) {
  uni.navigateTo({
    url: `/pages-oa/travel/reimbursement/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:travel-reimbursement:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:travel-reimbursement:reload', reload)
})
</script>
