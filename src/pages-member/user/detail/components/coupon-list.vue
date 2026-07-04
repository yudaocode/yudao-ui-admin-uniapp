<template>
  <view>
    <CouponSearchForm @search="handleQuery" @reset="handleReset" />
    <scroll-view scroll-y class="min-h-520rpx">
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.name || `优惠券 ${item.id}` }}
            </view>
            <dict-tag :type="DICT_TYPE.PROMOTION_COUPON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">优惠类型：</text>
            <dict-tag :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE" :value="item.discountType" />
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">领取方式：</text>
            <dict-tag :type="DICT_TYPE.PROMOTION_COUPON_TAKE_TYPE" :value="item.takeType" />
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">领取时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
          <view class="flex items-center justify-between gap-16rpx">
            <view class="text-24rpx text-[#999]">
              使用时间：{{ formatDateTime(item.useTime) || '-' }}
            </view>
            <wd-button
              v-if="hasAccessByCodes(['promotion:coupon:delete'])"
              size="small"
              type="danger" variant="plain"
              @click="handleDelete(item)"
            >
              回收
            </wd-button>
          </view>
        </view>
        <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无优惠券" />
        <view v-if="hasMore" class="pb-24rpx">
          <wd-button block variant="plain" :loading="loading" @click="loadMore">
            加载更多
          </wd-button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionCoupon } from '@/api/mall/promotion/coupon/coupon'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { deletePromotionCoupon, getPromotionCouponPage } from '@/api/mall/promotion/coupon/coupon'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import CouponSearchForm from './coupon-search-form.vue'

const props = defineProps<{
  userId?: number | any
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const list = ref<PromotionCoupon[]>([]) // 列表数据
const loading = ref(false) // 加载状态
const total = ref(0) // 总条数
const pageNo = ref(1) // 当前页码
const pageSize = 10 // 每页条数
const queryParams = ref<Record<string, any>>({}) // 查询参数
const hasMore = computed(() => list.value.length < total.value)

/** 查询优惠券 */
async function getList(reset = true) {
  if (!props.userId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const currentPageNo = reset ? 1 : pageNo.value + 1
    const data = await getPromotionCouponPage({
      ...queryParams.value,
      userIds: Number(props.userId),
      pageNo: currentPageNo,
      pageSize,
    })
    list.value = reset ? data.list : [...list.value, ...data.list]
    total.value = data.total
    pageNo.value = currentPageNo
  } finally {
    loading.value = false
  }
}

/** 加载更多 */
function loadMore() {
  getList(false)
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 回收优惠券 */
async function handleDelete(item: PromotionCoupon) {
  try {
    const { confirm } = await uni.showModal({
      title: '确认回收',
      content: '回收将收回会员领取的待使用优惠券，已使用的无法回收，确认继续吗？',
    })
    if (!confirm) {
      return
    }
    await deletePromotionCoupon(item.id!)
    toast.success('回收成功')
    getList()
  } catch {}
}

watch(
  () => props.userId,
  () => {
    getList()
  },
)

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('member:user:reload', getList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('member:user:reload', getList)
})
</script>
