<template>
  <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;" @close="handleClose">
    <view class="max-h-[80vh] p-32rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">发送优惠券</text>
        <wd-icon name="close" size="20px" @click="handleClose" />
      </view>
      <wd-search v-model="keyword" placeholder="搜索优惠券名称" @search="handleQuery" @clear="handleQuery" />
      <scroll-view scroll-y class="mt-20rpx h-[56vh]">
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
        <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无可发送优惠券" />
        <view v-if="hasMore" class="pb-24rpx">
          <wd-button variant="plain" block :loading="loading" @click="loadMore">
            加载更多
          </wd-button>
        </view>
      </scroll-view>
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
const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
}) // 弹窗显示状态
const keyword = ref('') // 搜索关键字
const list = ref<PromotionCouponTemplate[]>([]) // 列表数据
const loading = ref(false) // 加载状态
const total = ref(0) // 总条数
const pageNo = ref(1) // 当前页码
const sendingId = ref<number>() // 发送中的模板编号
const pageSize = 10 // 每页条数
const hasMore = computed(() => list.value.length < total.value)
const targetUserIds = computed(() => {
  if (props.userIds?.length) {
    return props.userIds.map(Number)
  }
  return props.userId ? [Number(props.userId)] : []
}) // 发券用户编号

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
async function getList(reset = true) {
  loading.value = true
  try {
    const currentPageNo = reset ? 1 : pageNo.value + 1
    const data = await getPromotionCouponTemplatePage({
      pageNo: currentPageNo,
      pageSize,
      name: keyword.value || undefined,
      canTakeTypes: [2],
    })
    list.value = reset ? data.list : [...list.value, ...data.list]
    total.value = data.total
    pageNo.value = currentPageNo
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  getList()
}

/** 加载更多 */
function loadMore() {
  getList(false)
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

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      getList()
    }
  },
)
</script>
