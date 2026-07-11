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
          选择可出库订单
        </view>
        <wd-button size="small" type="primary" :disabled="!currentOrder" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.no" placeholder="请输入订单单号" clearable />
        <ProductFormPicker v-model="queryParams.productId" label="" placeholder="请选择产品" class="mt-12rpx" />
        <yd-search-date-range v-model="queryParams.orderTime" class="mt-12rpx" label="订单时间" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 销售订单列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可出库订单"
        @query="queryList"
      >
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
                <text class="mr-8rpx text-[#999]">总数量：</text>{{ formatCount(item.totalCount) }}
              </view>
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">已出库：</text>{{ formatCount(item.outCount) }}
              </view>
            </view>
          </view>
        </view>
      </z-paging>
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
import ProductFormPicker from '@/pages-erp/product/product/components/product-form-picker.vue'

const emit = defineEmits<{
  success: [order: SaleOrder]
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const list = ref<SaleOrder[]>([]) // 可出库订单列表
const currentOrder = ref<SaleOrder>() // 当前选中订单
const pagingRef = ref<ZPagingRef<SaleOrder>>() // 分页组件引用
const queryParams = reactive({ // 查询参数
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  orderTime: [undefined, undefined] as [number | undefined, number | undefined],
})

/** 查询可出库订单 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSaleOrderPage({
      pageNo,
      pageSize,
      no: queryParams.no || undefined,
      productId: queryParams.productId,
      orderTime: formatDateRange(queryParams.orderTime),
      outEnable: true,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开选择器 */
function open() {
  visible.value = true
  reload()
}

/** 重新加载 */
function reload() {
  currentOrder.value = undefined
  pagingRef.value?.reload()
}

/** 选择订单 */
function handleSelect(item: SaleOrder) {
  currentOrder.value = item
}

/** 搜索按钮操作 */
function handleQuery() {
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.no = undefined
  queryParams.productId = undefined
  queryParams.orderTime = [undefined, undefined]
  reload()
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
