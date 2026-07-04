<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 弹窗标题栏 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择可退货订单
        </view>
        <wd-button size="small" type="primary" :disabled="!currentOrder" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.no" placeholder="请输入订单单号" clearable />
        <yd-form-picker v-model="queryParams.productId" class="mt-12rpx" :columns="productOptions" label-key="name" value-key="id" placeholder="请选择产品" />
        <yd-search-date-range v-model="queryParams.orderTime" class="mt-12rpx" label="订单时间" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 订单列表 -->
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleLoadMore">
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="currentOrder?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="handleSelect(item)"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.no || '-' }}
              </view>
              <wd-icon v-if="currentOrder?.id === item.id" name="check" size="18px" color="#1677ff" />
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">客户：</text>{{ item.customerName || '-' }}
            </view>
            <view v-if="item.productNames" class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">产品：</text>
              <text class="line-clamp-1">{{ item.productNames }}</text>
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">订单时间：</text>{{ formatDateTime(item.orderTime) || '-' }}
            </view>
            <view class="flex text-26rpx text-[#666]">
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">已出库：</text>{{ formatCount(item.outCount) }}
              </view>
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">已退货：</text>{{ formatCount(item.returnCount) }}
              </view>
            </view>
          </view>
          <view v-if="!loading && list.length === 0" class="py-80rpx text-center">
            <wd-empty icon="content" tip="暂无可退货订单" />
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
import type { SaleOrder } from '@/api/erp/sale/order'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { reactive, ref } from 'vue'
import { getSaleOrder, getSaleOrderPage } from '@/api/erp/sale/order'
import { formatCount } from '@/pages-erp/utils/format'
import { formatDateRange, formatDateTime } from '@/utils/date'
import { getProductSimpleList } from '@/api/erp/product/product'

const emit = defineEmits<{
  success: [order: SaleOrder]
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 列表加载状态
const finished = ref(false) // 是否加载完毕
const pageNo = ref(1) // 当前页码
const pageSize = 10
const total = ref(0) // 总条数
const list = ref<SaleOrder[]>([]) // 可退货订单列表
const currentOrder = ref<SaleOrder>() // 当前选中订单
const productOptions = ref<Record<string, any>[]>([]) // 产品选项
const queryParams = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  orderTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索条件

/** 查询可退货订单 */
async function queryList(reset = false) {
  if (loading.value) {
    return
  }
  if (reset) {
    pageNo.value = 1
    list.value = []
    finished.value = false
    currentOrder.value = undefined
  }
  if (finished.value) {
    return
  }
  loading.value = true
  try {
    const data = await getSaleOrderPage({
      pageNo: pageNo.value,
      pageSize,
      no: queryParams.no || undefined,
      productId: queryParams.productId,
      orderTime: formatDateRange(queryParams.orderTime),
      returnEnable: true,
    })
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

/** 打开选择器 */
async function open() {
  visible.value = true
  await loadOptions()
  await queryList(true)
}

/** 选择订单 */
function handleSelect(item: SaleOrder) {
  currentOrder.value = item
}

/** 搜索按钮操作 */
function handleSearch() {
  queryList(true)
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.no = undefined
  queryParams.productId = undefined
  queryParams.orderTime = [undefined, undefined]
  queryList(true)
}

/** 加载更多 */
function handleLoadMore() {
  queryList()
}

/** 确认选择 */
async function handleConfirm() {
  if (!currentOrder.value?.id) {
    toast.warning('请选择销售订单')
    return
  }
  const detail = await getSaleOrder(Number(currentOrder.value.id))
  emit('success', detail)
  visible.value = false
}

defineExpose({ open })
</script>
