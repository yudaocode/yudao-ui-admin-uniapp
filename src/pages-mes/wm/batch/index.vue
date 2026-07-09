<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="MES 批次管理" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 批次列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无批次数据"
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
                <view class="mt-4rpx truncate text-24rpx text-[#999]">
                  {{ item.lotNumber || '无生产批号' }}
                </view>
              </view>
              <dict-tag v-if="item.qualityStatus != null" :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="item.qualityStatus" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">物料：</text>
              <text class="min-w-0 flex-1 truncate">{{ getItemText(item) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">规格单位：</text>
              <text class="min-w-0 flex-1 truncate">{{ getSpecUnitText(item) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">供应商：</text>
              <text class="min-w-0 flex-1 truncate">{{ getVendorText(item) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">客户：</text>
              <text class="min-w-0 flex-1 truncate">{{ getClientText(item) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">订单编号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.purchaseOrderCode || item.salesOrderCode || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">入库日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.receiptDate) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Batch } from '@/api/mes/wm/batch'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getBatchPage } from '@/api/mes/wm/batch'
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
const list = ref<Batch[]>([]) // 批次列表
const pagingRef = ref<ZPagingRef<Batch>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询批次列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getBatchPage(params)
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

/** 物料展示 */
function getItemText(item: Batch) {
  if (item.itemCode || item.itemName) {
    return `${item.itemCode || '-'} / ${item.itemName || '-'}`.trim()
  }
  return item.itemId ? `物料 #${item.itemId}` : '-'
}

/** 规格单位展示 */
function getSpecUnitText(item: Batch) {
  return [
    item.itemSpecification,
    item.unitName,
  ].filter(Boolean).join(' / ') || '-'
}

/** 供应商展示 */
function getVendorText(item: Batch) {
  return [
    item.vendorCode,
    item.vendorName,
  ].filter(Boolean).join(' / ') || '-'
}

/** 客户展示 */
function getClientText(item: Batch) {
  return [
    item.clientCode,
    item.clientName,
  ].filter(Boolean).join(' / ') || '-'
}

/** 查看详情 */
function handleDetail(item: Batch) {
  if (!hasAccessByCodes(['mes:wm-batch:query'])) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/wm/batch/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:batch:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:batch:reload', reload)
})
</script>
