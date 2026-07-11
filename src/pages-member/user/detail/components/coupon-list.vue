<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <!-- 搜索组件 -->
    <CouponSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 优惠券列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无优惠券"
      @query="queryList"
    >
      <view class="p-24rpx pb-160rpx">
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
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionCoupon } from '@/api/mall/promotion/coupon/coupon'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref, watch } from 'vue'
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
const pagingRef = ref<ZPagingRef<PromotionCoupon>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 查询优惠券 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.userId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getPromotionCouponPage({
      ...queryParams.value,
      userIds: Number(props.userId),
      pageNo,
      pageSize,
    })
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
    reload()
  } catch {}
}

/** 监听会员变化，重新加载列表 */
watch(
  () => props.userId,
  () => reload(),
)

/** 初始化 */
onMounted(() => {
  uni.$on('member:user:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('member:user:reload', reload)
})
</script>
