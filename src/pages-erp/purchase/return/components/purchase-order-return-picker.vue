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
          选择可退货订单
        </view>
        <wd-button size="small" type="primary" :disabled="!currentOrder" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.no" placeholder="请输入订单单号" clearable />
        <ProductFormPicker v-model="queryParams.productId" label="" placeholder="请选择产品" class="mt-12rpx" />
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
              <text class="mr-8rpx text-[#999]">供应商：</text>{{ item.supplierName || '-' }}
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
                <text class="mr-8rpx text-[#999]">已入库：</text>{{ formatCount(item.inCount) }}
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
import type { PurchaseOrder } from '@/api/erp/purchase/order'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { reactive, ref } from 'vue'
import { getPurchaseOrder, getPurchaseOrderPage } from '@/api/erp/purchase/order'
import { formatCount } from '@/pages-erp/utils/format'
import { formatDateRange, formatDateTime } from '@/utils/date'
import ProductFormPicker from '@/pages-erp/product/product/components/product-form-picker.vue'

const emit = defineEmits<{
  success: [order: PurchaseOrder]
}>()

const toast = useToast()
const visible = ref(false)
const loading = ref(false)
const finished = ref(false)
const pageNo = ref(1)
const pageSize = 10
const total = ref(0)
const list = ref<PurchaseOrder[]>([])
const currentOrder = ref<PurchaseOrder>()
let requestId = 0 // 最新查询标识
const queryParams = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  orderTime: [undefined, undefined] as [number | undefined, number | undefined],
})

/** 查询可退货订单列表 */
async function queryList(reset = false) {
  if (!reset && (loading.value || finished.value)) {
    return
  }
  if (reset) {
    pageNo.value = 1
    list.value = []
    finished.value = false
    currentOrder.value = undefined
  }
  const currentRequestId = ++requestId
  const currentPageNo = pageNo.value
  loading.value = true
  try {
    const data = await getPurchaseOrderPage({
      pageNo: currentPageNo,
      pageSize,
      no: queryParams.no || undefined,
      productId: queryParams.productId,
      orderTime: formatDateRange(queryParams.orderTime),
      returnEnable: true,
    })
    if (currentRequestId !== requestId) {
      return
    }
    list.value = reset ? data.list : list.value.concat(data.list)
    total.value = data.total
    finished.value = list.value.length >= total.value
    pageNo.value = currentPageNo + 1
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

/** 打开选择弹窗 */
async function open() {
  visible.value = true
  await queryList(true)
}

/** 选择采购订单 */
function handleSelect(item: PurchaseOrder) {
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
    toast.warning('请选择采购订单')
    return
  }
  const detail = await getPurchaseOrder(Number(currentOrder.value.id))
  emit('success', detail)
  visible.value = false
}

defineExpose({ open })
</script>
