<template>
  <!-- 发送优惠券弹窗 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 80vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="box-border h-full flex flex-col overflow-hidden p-32rpx">
      <!-- 弹窗标题 -->
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">发送优惠券</text>
        <wd-icon name="close" size="20px" @click="handleClose" />
      </view>

      <!-- 搜索组件 -->
      <wd-search v-model="queryParams.name" placeholder="搜索优惠券名称" @search="handleQuery" @clear="handleQuery" />

      <!-- 优惠券模板列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="mt-20rpx min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可发送优惠券"
        @query="queryList"
      >
        <view class="pb-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.name || `优惠券 ${item.id}` }}
              </view>
              <wd-button
                v-if="hasAccessByCodes(['promotion:coupon:send'])"
                size="small"
                type="primary"
                :loading="sendingId === item.id"
                @click="handleSend(item)"
              >
                发送
              </wd-button>
            </view>
            <view class="mb-8rpx text-24rpx text-[#666]">
              优惠：{{ formatDiscount(item) }}
            </view>
            <view class="mb-8rpx text-24rpx text-[#666]">
              最低消费：{{ formatAmount(item.usePrice) }}
            </view>
            <view class="text-24rpx text-[#999]">
              剩余数量：{{ formatRemainCount(item) }}
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { PromotionCouponTemplate } from '@/api/mall/promotion/coupon/coupon-template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { sendPromotionCoupon } from '@/api/mall/promotion/coupon/coupon'
import { getPromotionCouponTemplatePage } from '@/api/mall/promotion/coupon/coupon-template'
import { useAccess } from '@/hooks/useAccess'

const props = defineProps<{
  modelValue: boolean
  userId?: number | any
  userIds?: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const toast = useToast()
const { hasAccessByCodes } = useAccess()
const visible = computed({ // 弹窗显示状态
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})
const queryParams = ref<Record<string, any>>({ name: '' }) // 查询参数
const list = ref<PromotionCouponTemplate[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<PromotionCouponTemplate>>() // 分页组件引用
const sendingId = ref<number>() // 发送中的模板编号
const targetUserIds = computed(() => { // 发券用户编号
  if (props.userIds?.length) {
    return props.userIds.map(Number)
  }
  return props.userId ? [Number(props.userId)] : []
})

/** 金额分转元展示 */
function formatAmount(value?: number | string) {
  return `￥${(Number(value || 0) / 100).toFixed(2)}`
}

/** 优惠信息展示 */
function formatDiscount(item: PromotionCouponTemplate) {
  if (item.discountType === 1) {
    return formatAmount(item.discountPrice)
  }
  if (item.discountType === 2) {
    return `${item.discountPercent || 0}%`
  }
  return '-'
}

/** 剩余数量展示 */
function formatRemainCount(item: PromotionCouponTemplate) {
  if (item.totalCount === -1) {
    return '不限'
  }
  return Math.max((item.totalCount || 0) - (item.takeCount || 0), 0)
}

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
}

/** 查询优惠券模板 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPromotionCouponTemplatePage({
      pageNo,
      pageSize,
      name: queryParams.value.name || undefined,
      canTakeTypes: [2],
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 发送优惠券 */
async function handleSend(item: PromotionCouponTemplate) {
  if (targetUserIds.value.length === 0 || !item.id) {
    return
  }
  sendingId.value = item.id
  try {
    await sendPromotionCoupon({
      templateId: item.id,
      userIds: targetUserIds.value,
    })
    toast.success('发送成功')
    handleClose()
    emit('success')
  } finally {
    sendingId.value = undefined
  }
}

/** 监听弹窗打开，重新加载列表 */
watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      queryParams.value = { name: '' }
      reload()
    }
  },
)
</script>
