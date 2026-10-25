<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="优惠券模板详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="模板名称" :value="formData.name || '-'" />
      <wd-cell title="状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="发放数量" :value="formData.totalCount === -1 ? '不限' : (formData.totalCount != null ? String(formData.totalCount) : '-')" />
      <wd-cell title="每人限领" :value="formData.takeLimitCount != null ? String(formData.takeLimitCount) : '-'" />
      <wd-cell title="领取方式">
        <dict-tag v-if="formData.takeType != null" :type="DICT_TYPE.PROMOTION_COUPON_TAKE_TYPE" :value="formData.takeType" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="使用门槛" :value="formatDisplayMoney(formData.usePrice)" />
      <wd-cell title="优惠类型">
        <dict-tag v-if="formData.discountType != null" :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE" :value="formData.discountType" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell v-if="formData.discountType === PromotionDiscountTypeEnum.PRICE" title="优惠金额" :value="formatDisplayMoney(formData.discountPrice)" />
      <template v-else-if="formData.discountType === PromotionDiscountTypeEnum.PERCENT">
        <wd-cell title="折扣百分比" :value="formData.discountPercent != null ? `${formData.discountPercent}%` : '-'" />
        <wd-cell title="最多优惠" :value="formatDisplayMoney(formData.discountLimitPrice)" />
      </template>
      <wd-cell title="有效期类型">
        <dict-tag v-if="formData.validityType != null" :type="DICT_TYPE.PROMOTION_COUPON_TEMPLATE_VALIDITY_TYPE" :value="formData.validityType" />
        <text v-else>-</text>
      </wd-cell>
      <template v-if="formData.validityType === CouponTemplateValidityTypeEnum.DATE">
        <wd-cell title="固定开始" :value="formatDateTime(formData.validStartTime) || '-'" />
        <wd-cell title="固定结束" :value="formatDateTime(formData.validEndTime) || '-'" />
      </template>
      <template v-else-if="formData.validityType === CouponTemplateValidityTypeEnum.TERM">
        <wd-cell title="领取后生效" :value="formData.fixedStartTerm != null ? `第 ${formData.fixedStartTerm} 天` : '-'" />
        <wd-cell title="有效天数" :value="formData.fixedEndTerm != null ? `${formData.fixedEndTerm} 天` : '-'" />
      </template>
      <wd-cell title="已领取" :value="formData.takeCount != null ? String(formData.takeCount) : '-'" />
      <wd-cell title="已使用" :value="formData.useCount != null ? String(formData.useCount) : '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['promotion:coupon-template:update', 'promotion:coupon-template:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['promotion:coupon-template:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:coupon-template:update']) && formData.status === CommonStatusEnum.DISABLE" class="flex-1" type="primary" :loading="submitting" @click="() => handleStatus(CommonStatusEnum.ENABLE)">
          启用
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:coupon-template:update']) && formData.status === CommonStatusEnum.ENABLE" class="flex-1" type="info" :loading="submitting" @click="() => handleStatus(CommonStatusEnum.DISABLE)">
          禁用
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:coupon-template:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionCouponTemplate } from '@/api/mall/promotion/coupon/coupon-template'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  deletePromotionCouponTemplate,
  getPromotionCouponTemplate,
  updatePromotionCouponTemplateStatus,
} from '@/api/mall/promotion/coupon/coupon-template'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney } from '@/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, CouponTemplateValidityTypeEnum, DICT_TYPE, PromotionDiscountTypeEnum } from '@/utils/constants'
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
const formData = ref<PromotionCouponTemplate>({}) // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 状态切换提交状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/coupon/template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionCouponTemplate(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/coupon/template/form/index?id=${props.id}` })
}

/** 启用 / 禁用 */
async function handleStatus(status: number) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${status === CommonStatusEnum.ENABLE ? '启用' : '禁用'}该优惠券模板吗？` })
  } catch {
    return
  }
  submitting.value = true
  try {
    await updatePromotionCouponTemplateStatus({ id: props.id, status })
    toast.success('操作成功')
    uni.$emit('mall:promotion-coupon-template:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 删除 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该优惠券模板吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionCouponTemplate(props.id)
    toast.success('删除成功')
    uni.$emit('mall:promotion-coupon-template:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
