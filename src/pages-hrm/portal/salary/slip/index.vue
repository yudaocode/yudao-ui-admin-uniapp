<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我的工资条"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <!-- 搜索组件 -->
      <SearchForm @search="handleQuery" @reset="handleReset" />

      <!-- 工资条列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-enabled="false"
        empty-view-text="暂无工资条"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleDetail(item)"
          >
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ formatHrmYearMonth(item.year, item.month) }} 工资条
              </view>
              <view
                v-if="item.readStatus === 0"
                class="shrink-0 rounded-6rpx bg-[#ff4d4f] px-12rpx py-4rpx text-22rpx text-white"
              >
                新工资条
              </view>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">实发工资：</text>
              <text class="text-[#1677ff] font-semibold">
                {{ formatHrmMoney(item.realPaySalary) }}
              </text>
            </view>
            <view v-if="item.remark" class="text-26rpx text-[#999]">
              备注：{{ item.remark }}
            </view>
          </view>
        </view>
      </z-paging>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { SalarySlip, SalarySlipListReq } from '@/api/hrm/portal/salary/slip'
import { onMounted, ref } from 'vue'
import { getSalarySlipList, markSalarySlipRead } from '@/api/hrm/portal/salary/slip'
import {
  HRM_SALARY_SLIP_SORT_OPTIONS,
  HrmSalarySlipSort,
} from '@/pages-hrm/utils/constants'
import { formatHrmMoney, formatHrmYearMonth } from '@/pages-hrm/utils/format'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const accessible = ref(false) // 是否可访问
const list = ref<SalarySlip[]>([]) // 工资条列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({
  sort: HrmSalarySlipSort.RECENT_SEND,
}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 组装列表请求参数 */
function buildListParams(): SalarySlipListReq {
  const params: SalarySlipListReq = {}
  if (queryParams.value.startMonth && queryParams.value.endMonth) {
    params.startMonth = queryParams.value.startMonth
    params.endMonth = queryParams.value.endMonth
  }
  const sortOption = HRM_SALARY_SLIP_SORT_OPTIONS.find(
    item => item.value === (queryParams.value.sort ?? HrmSalarySlipSort.RECENT_SEND),
  )
  if (sortOption) {
    params.orderType = sortOption.orderType
    params.order = sortOption.order
  }
  return params
}

/** 查询工资条列表 */
async function queryList() {
  try {
    const data = (await getSalarySlipList(buildListParams())) || []
    list.value = data
    pagingRef.value?.completeByTotal(data, data.length)
    const unreadIds = data.filter(item => item.readStatus === 0).map(item => item.id)
    if (unreadIds.length) {
      await markSalarySlipRead(unreadIds)
    }
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    startMonth: data?.startMonth,
    endMonth: data?.endMonth,
    sort: data?.sort ?? HrmSalarySlipSort.RECENT_SEND,
  }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({ sort: HrmSalarySlipSort.RECENT_SEND })
}

/** 查看详情 */
function handleDetail(item: SalarySlip) {
  uni.navigateTo({ url: `/pages-hrm/portal/salary/slip/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(async () => {
  accessible.value = await checkHrmPortalAccess()
})
</script>
