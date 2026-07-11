<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
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

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.no" placeholder="请输入销售退货单号" clearable />
        <ProductFormPicker v-model="queryParams.productId" label="" placeholder="请选择产品" class="mt-12rpx" />
        <yd-search-date-range v-model="queryParams.time" class="mt-12rpx" label="退货时间" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 可退款销售退货列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可选择销售退货"
        @query="queryList"
      >
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
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import ProductFormPicker from '@/pages-erp/product/product/components/product-form-picker.vue'
import type { SaleReturn } from '@/api/erp/sale/return'
import { getSaleReturnPage } from '@/api/erp/sale/return'
import { formatDateRange, formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'

const emit = defineEmits<{
  success: [rows: SaleReturn[]]
}>()

const visible = ref(false) // 弹窗显示状态
const customerId = ref<number>() // 客户编号
const list = ref<SaleReturn[]>([]) // 可退款销售退货列表
const selectedRows = ref<SaleReturn[]>([]) // 已选销售退货
const pagingRef = ref<ZPagingRef<SaleReturn>>() // 分页组件引用
const queryParams = reactive({ // 查询参数
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
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      pageNo,
      pageSize,
      no: queryParams.no || undefined,
      productId: queryParams.productId,
      customerId: customerId.value,
      returnTime: formatDateRange(queryParams.time),
      refundEnable: true,
    }
    const data = await getSaleReturnPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开选择弹窗 */
function open(nextCustomerId: number) {
  customerId.value = nextCustomerId
  visible.value = true
  reload()
}

/** 重新加载 */
function reload() {
  selectedRows.value = []
  pagingRef.value?.reload()
}

/** 搜索按钮操作 */
function handleQuery() {
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.no = undefined
  queryParams.productId = undefined
  queryParams.time = [undefined, undefined]
  reload()
}

/** 确认选择 */
function handleConfirm() {
  emit('success', selectedRows.value)
  visible.value = false
}

defineExpose({ open })
</script>
