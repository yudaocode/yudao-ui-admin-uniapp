<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="示例订单"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无示例订单数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.spuName || `示例订单 #${item.id}` }}
              </view>
              <view class="mt-6rpx text-24rpx text-[#999]">
                订单编号：{{ item.id || '-' }}
              </view>
            </view>
            <view class="shrink-0 rounded-8rpx px-12rpx py-4rpx text-22rpx" :class="payStatusClass(item)">
              {{ payStatusLabel(item) }}
            </view>
          </view>

          <view class="mb-16rpx text-36rpx text-[#fa8c16] font-semibold">
            {{ formatDisplayMoney(item.price) }}
          </view>

          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">用户编号：</text>
            <text>{{ item.userId || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
          <view v-if="item.payOrderId" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">支付单号：</text>
            <text>{{ item.payOrderId }}</text>
          </view>
          <view v-if="item.payTime" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">支付时间：</text>
            <text>{{ formatDateTime(item.payTime) }}</text>
          </view>
          <view v-if="item.payRefundId || item.refundTime" class="mb-16rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">退款时间：</text>
            <text>{{ getRefundText(item) }}</text>
          </view>
          <view v-if="item.refundPrice" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">退款金额：</text>
            <text>{{ formatDisplayMoney(item.refundPrice) }}</text>
          </view>

          <view class="flex gap-16rpx">
            <wd-button
              v-if="!item.payStatus && item.payOrderId"
              class="flex-1"
              size="small"
              type="primary"
              @click="handlePay(item)"
            >
              前往支付
            </wd-button>
            <wd-button
              v-if="item.payStatus && !item.payRefundId"
              class="flex-1"
              size="small"
              type="warning" variant="plain"
              :loading="refundingId === item.id"
              @click="handleRefund(item)"
            >
              发起退款
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="openCreatePopup"
    />

    <!-- 发起订单弹窗 -->
    <wd-popup
      v-model="createVisible"
      position="bottom"
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      safe-area-inset-bottom
      @close="resetForm"
    >
      <view class="p-32rpx">
        <view class="mb-24rpx flex items-center justify-between">
          <text class="text-32rpx text-[#333] font-semibold">发起订单</text>
          <wd-icon name="close" size="20px" @click="createVisible = false" />
        </view>

        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-form-item title="商品" title-width="160rpx" prop="spuId">
            <wd-radio-group v-model="formData.spuId" type="button">
              <wd-radio
                v-for="item in spuOptions"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }} {{ formatDisplayMoney(item.price) }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
        </wd-form>

        <view class="mt-32rpx">
          <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { PayDemoOrder } from '@/api/pay/demo/order'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import {
  createPayDemoOrder,
  getPayDemoOrderPage,
  refundPayDemoOrder,
} from '@/api/pay/demo/order'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { formatDisplayMoney } from '@/utils/format'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const list = ref<PayDemoOrder[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const formRef = ref<FormInstance>() // 表单组件引用
const createVisible = ref(false) // 发起订单弹窗状态
const formLoading = ref(false) // 表单提交状态
const refundingId = ref<number>() // 退款中的订单编号
const formData = ref({
  spuId: undefined as number | undefined,
}) // 表单数据
const formSchema = createFormSchema({
  spuId: [{ required: true, message: '商品不能为空' }],
})
const spuOptions = [
  { id: 1, name: '华为手机', price: 1 },
  { id: 2, name: '小米电视', price: 10 },
  { id: 3, name: '苹果手表', price: 100 },
  { id: 4, name: '华硕笔记本', price: 1000 },
  { id: 5, name: '蔚来汽车', price: 200000 },
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPayDemoOrderPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 支付状态文案：已退款 / 已支付 / 未支付 */
function payStatusLabel(item: PayDemoOrder) {
  if (item.refundPrice || item.payRefundId) {
    return '已退款'
  }
  return item.payStatus ? '已支付' : '未支付'
}

/** 支付状态标签样式 */
function payStatusClass(item: PayDemoOrder) {
  if (item.refundPrice || item.payRefundId) {
    return 'bg-[#fff1f0] text-[#fa4350]'
  }
  return item.payStatus ? 'bg-[#e6f4ff] text-[#1677ff]' : 'bg-[#f5f5f5] text-[#999]'
}

/** 退款时间展示 */
function getRefundText(item: PayDemoOrder) {
  if (item.refundTime) {
    return formatDateTime(item.refundTime) || '-'
  }
  if (item.payRefundId) {
    return '退款中，等待退款结果'
  }
  return '-'
}

/** 打开发起订单弹窗 */
function openCreatePopup() {
  resetForm()
  createVisible.value = true
}

/** 重置表单 */
function resetForm() {
  formData.value = {
    spuId: undefined,
  }
  formRef.value?.reset()
}

/** 提交订单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    await createPayDemoOrder(formData.value)
    toast.success('创建成功')
    createVisible.value = false
    pagingRef.value?.reload()
  } finally {
    formLoading.value = false
  }
}

/** 前往支付 */
function handlePay(item: PayDemoOrder) {
  if (!item.payOrderId) {
    return
  }
  uni.navigateTo({
    url: `/pages-pay/cashier/index?id=${item.payOrderId}&returnUrl=${encodeURIComponent('/pages-pay/demo/order/index')}`,
  })
}

/** 发起退款 */
async function handleRefund(item: PayDemoOrder) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要发起示例订单 #${item.id} 的退款吗？`,
    })
  } catch {
    return
  }

  refundingId.value = item.id
  try {
    await refundPayDemoOrder(item.id)
    toast.success('发起退款成功')
    pagingRef.value?.reload()
  } finally {
    refundingId.value = undefined
  }
}
</script>
