<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择销售退货（仅展示可退款）
        </view>
        <wd-button size="small" type="primary" :disabled="selectedRows.length === 0" @click="handleConfirm">
          确定{{ selectedRows.length ? `(${selectedRows.length})` : '' }}
        </wd-button>
      </view>

      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.no" placeholder="请输入销售退货单号" clearable />
        <yd-form-picker v-model="queryParams.productId" class="mt-12rpx" :columns="productOptions" label-key="name" value-key="id" placeholder="请选择产品" />
        <yd-search-date-range v-model="queryParams.time" class="mt-12rpx" label="退货时间" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>

      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleLoadMore">
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="isSelected(item) ? 'ring-2 ring-[#1677ff]' : ''"
            @click="toggleSelect(item)"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.no || '-' }}
              </view>
              <text v-if="isSelected(item)" class="shrink-0 text-24rpx text-[#1677ff]">已选择</text>
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">客户：</text>{{ item.customerName || '-' }}
            </view>
            <view v-if="item.productNames" class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">产品：</text>
              <text class="line-clamp-1">{{ item.productNames }}</text>
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">退货时间：</text>{{ formatDateTime(item.returnTime) || '-' }}
            </view>
            <view class="flex text-26rpx text-[#666]">
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">应退金额：</text>{{ formatMoney(item.totalPrice) }}
              </view>
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">已退金额：</text>{{ formatMoney(item.refundPrice) }}
              </view>
            </view>
          </view>
          <view v-if="!loading && list.length === 0" class="py-80rpx text-center">
            <wd-empty icon="content" tip="暂无可选择销售退货" />
          </view>
          <view v-if="loading" class="py-24rpx text-center text-26rpx text-[#999]">
            加载中...
          </view>
          <view v-else-if="finished && list.length > 0" class="py-24rpx text-center text-26rpx text-[#999]">
            没有更多了
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { getProductSimpleList } from '@/api/erp/product/product'
import type { SaleReturn } from '@/api/erp/sale/return'
import { getSaleReturnPage } from '@/api/erp/sale/return'
import { formatDateRange, formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'

const emit = defineEmits<{
  success: [rows: SaleReturn[]]
}>()

const visible = ref(false)
const loading = ref(false)
const finished = ref(false)
const pageNo = ref(1)
const pageSize = 10
const total = ref(0)
const customerId = ref<number>()
const list = ref<SaleReturn[]>([])
const selectedRows = ref<SaleReturn[]>([])
const productOptions = ref<Record<string, any>[]>([]) // 产品选项
const queryParams = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  time: [undefined, undefined] as [number | undefined, number | undefined],
})

/** 判断是否已选择 */
function isSelected(item: SaleReturn) {
  return selectedRows.value.some(row => String(row.id) === String(item.id))
}

/** 切换选择状态 */
function toggleSelect(item: SaleReturn) {
  if (isSelected(item)) {
    selectedRows.value = selectedRows.value.filter(row => String(row.id) !== String(item.id))
  } else {
    selectedRows.value.push(item)
  }
}

/** 查询可选单据列表 */
async function queryList(reset = false) {
  if (loading.value) {
    return
  }
  if (reset) {
    pageNo.value = 1
    list.value = []
    selectedRows.value = []
    finished.value = false
  }
  if (finished.value) {
    return
  }
  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize,
      no: queryParams.no || undefined,
      productId: queryParams.productId,
      customerId: customerId.value,
      returnTime: formatDateRange(queryParams.time),
      refundEnable: true,
    }
    const data = await getSaleReturnPage(params)
    list.value = reset ? data.list : list.value.concat(data.list)
    total.value = data.total
    finished.value = list.value.length >= total.value
    pageNo.value += 1
  } finally {
    loading.value = false
  }
}

/** 加载基础选项 */
async function loadOptions() {
  if (productOptions.value.length === 0) {
    productOptions.value = await getProductSimpleList()
  }
}

/** 打开选择弹窗 */
async function open(nextCustomerId: number) {
  customerId.value = nextCustomerId
  visible.value = true
  await loadOptions()
  await queryList(true)
}

/** 搜索按钮操作 */
function handleSearch() {
  queryList(true)
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.no = undefined
  queryParams.productId = undefined
  queryParams.time = [undefined, undefined]
  queryList(true)
}

/** 加载更多 */
function handleLoadMore() {
  queryList()
}

/** 确认选择 */
function handleConfirm() {
  emit('success', selectedRows.value)
  visible.value = false
}

defineExpose({ open })
</script>
