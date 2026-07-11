<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="满减送详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="活动名称" :value="formData.name || '-'" />
            <wd-cell title="活动状态">
              <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="条件类型" :value="conditionTypeLabel" />
            <wd-cell title="商品范围" :value="productScopeLabel" />
            <wd-cell title="开始时间" :value="formatDateTime(formData.startTime) || '-'" />
            <wd-cell title="结束时间" :value="formatDateTime(formData.endTime) || '-'" />
            <wd-cell title="备注" :value="formData.remark || '-'" />
          </wd-cell-group>
        </view>

        <!-- 优惠规则 -->
        <view v-if="formData.rules?.length" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
            优惠规则
          </view>
          <view v-for="(rule, index) in formData.rules" :key="index" class="px-24rpx py-16rpx text-26rpx text-[#666]">
            <view>
              <text>满 {{ formatLimit(rule.limit) }}，减 {{ formatDisplayMoney(rule.discountPrice) }}</text>
              <text v-if="rule.freeDelivery">，包邮</text>
              <text v-if="rule.point">，送 {{ rule.point }} 积分</text>
            </view>
            <view v-if="couponCounts(rule).length" class="mt-6rpx text-24rpx text-[#999]">
              赠送优惠券：{{ couponCounts(rule).map(item => `${couponLabel(item.templateId)}×${item.count}`).join('、') }}
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['promotion:reward-activity:update', 'promotion:reward-activity:delete', 'promotion:reward-activity:close'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['promotion:reward-activity:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:reward-activity:close'])" class="flex-1" type="info" :loading="closing" @click="handleClose">
          关闭活动
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:reward-activity:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionCouponTemplate } from '@/api/mall/promotion/coupon/coupon-template'
import type { PromotionRewardActivity, PromotionRewardRule } from '@/api/mall/promotion/reward'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getPromotionCouponTemplateList } from '@/api/mall/promotion/coupon/coupon-template'
import {
  closePromotionRewardActivity,
  deletePromotionRewardActivity,
  getPromotionRewardActivity,
} from '@/api/mall/promotion/reward'
import { useAccess } from '@/hooks/useAccess'
import { fenToYuan, formatDisplayMoney } from '@/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, PromotionConditionTypeEnum, PromotionProductScopeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<PromotionRewardActivity>({}) // 详情数据
const couponTemplates = ref<PromotionCouponTemplate[]>([]) // 优惠券模板列表（用于赠券名称回显）
const deleting = ref(false) // 删除状态
const closing = ref(false) // 关闭状态
const conditionTypeLabel = computed(() => formData.value.conditionType === PromotionConditionTypeEnum.COUNT ? '满件数' : '满金额') // 条件类型文案
const productScopeLabel = computed(() => ({ [PromotionProductScopeEnum.ALL]: '全部商品', [PromotionProductScopeEnum.SPU]: '指定商品', [PromotionProductScopeEnum.CATEGORY]: '指定分类' } as Record<number, string>)[formData.value.productScope ?? PromotionProductScopeEnum.ALL] || '-') // 商品范围文案

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/reward-activity/index')
}

/** 条件值文案：满金额转元、满件数为整数 */
function formatLimit(limit?: number) {
  if (limit == null) {
    return '-'
  }
  return formData.value.conditionType === PromotionConditionTypeEnum.COUNT ? `${limit} 件` : `${fenToYuan(limit).toFixed(2)} 元`
}

/** 规则赠送的优惠券（模板编号 + 数量）数组 */
function couponCounts(rule: PromotionRewardRule) {
  return Object.entries(rule.giveCouponTemplateCounts || {}).map(([templateId, count]) => ({
    templateId: Number(templateId),
    count: Number(count) || 0,
  }))
}

/** 优惠券模板名称 */
function couponLabel(templateId: number) {
  return couponTemplates.value.find(item => item.id === templateId)?.name || `模板 #${templateId}`
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionRewardActivity(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/reward-activity/form/index?id=${props.id}` })
}

/** 关闭活动 */
async function handleClose() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要关闭该活动吗？' })
  } catch {
    return
  }
  closing.value = true
  try {
    await closePromotionRewardActivity(Number(props.id))
    toast.success('关闭成功')
    uni.$emit('mall:promotion-reward-activity:reload')
    await getDetail()
  } finally {
    closing.value = false
  }
}

/** 删除 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该满减送活动吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionRewardActivity(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mall:promotion-reward-activity:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 加载优惠券模板（用于赠券名称回显） */
async function loadCouponTemplates() {
  const templateIds = new Set<number>()
  formData.value.rules?.forEach((rule) => {
    Object.keys(rule.giveCouponTemplateCounts || {}).forEach(id => templateIds.add(Number(id)))
  })
  couponTemplates.value = templateIds.size
    ? await getPromotionCouponTemplateList(Array.from(templateIds))
    : []
}

/** 加载完整详情 */
async function loadDetail() {
  await getDetail()
  await loadCouponTemplates()
}

/** 初始化 */
onMounted(async () => {
  await loadDetail()
  uni.$on('mall:promotion-reward-activity:reload', loadDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-reward-activity:reload', loadDetail)
})
</script>
