<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="付款单" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 付款单列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无付款单数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list" :key="item.id"
          class="erp-list-card relative mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view>
            <view class="p-24rpx">
              <view class="mb-16rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                  {{ item.no || '保存后自动生成' }}
                </view>
                <dict-tag :type="DICT_TYPE.ERP_AUDIT_STATUS" :value="item.status" />
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">供应商：</text>{{ item.supplierName || '-' }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">付款时间：</text>{{ formatDateTime(item.paymentTime) || '-' }}
              </view>
              <view class="mb-12rpx flex text-28rpx text-[#666]">
                <view class="flex-1">
                  <text class="mr-8rpx text-[#999]">财务：</text>{{ item.financeUserName || '-' }}
                </view>
                <view class="flex-1">
                  <text class="mr-8rpx text-[#999]">账户：</text>{{ item.accountName || '-' }}
                </view>
              </view>
              <view class="flex text-28rpx text-[#666]">
                <view class="flex-1">
                  <text class="mr-8rpx text-[#999]">合计：</text>{{ formatMoney(item.totalPrice) }}
                </view>
                <view class="flex-1">
                  <text class="mr-8rpx text-[#999]">实付：</text>{{ formatMoney(item.paymentPrice) }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['erp:finance-payment:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FinancePayment } from '@/api/erp/finance/payment'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getFinancePaymentPage } from '@/api/erp/finance/payment'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'
import { formatMoney } from '@/utils/format'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<FinancePayment[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getFinancePaymentPage({ ...queryParams.value, pageNo, pageSize })
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
  uni.navigateTo({ url: '/pages-erp/finance/payment/form/index' })
}

/** 查看详情 */
function handleDetail(item: FinancePayment) {
  uni.navigateTo({ url: `/pages-erp/finance/payment/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('erp:finance-payment:reload', reload)
})

/** 解绑页面事件 */
onUnload(() => {
  uni.$off('erp:finance-payment:reload', reload)
})
</script>
