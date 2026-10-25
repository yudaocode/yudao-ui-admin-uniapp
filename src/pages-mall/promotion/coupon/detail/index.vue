<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="优惠券详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="优惠券名称" :value="formData.name || '-'" />
      <wd-cell title="模板编号" :value="formData.templateId != null ? String(formData.templateId) : '-'" />
      <wd-cell title="用户编号" :value="formData.userId != null ? String(formData.userId) : '-'" />
      <wd-cell title="优惠类型">
        <dict-tag v-if="formData.discountType != null" :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE" :value="formData.discountType" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="使用门槛" :value="formatDisplayMoney(formData.usePrice)" />
      <wd-cell title="优惠金额" :value="formatDisplayMoney(formData.discountPrice)" />
      <wd-cell title="状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.PROMOTION_COUPON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="使用时间" :value="formatDateTime(formData.useTime) || '-'" />
      <wd-cell title="领取时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['promotion:coupon:delete'])" class="yd-detail-footer">
      <wd-button type="danger" block :loading="deleting" @click="handleDelete">
        删除（回收）
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionCoupon } from '@/api/mall/promotion/coupon/coupon'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deletePromotionCoupon, getPromotionCoupon } from '@/api/mall/promotion/coupon/coupon'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney } from '@/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const formData = ref<PromotionCoupon>({}) // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/coupon/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionCoupon(props.id)
  } finally {
    toast.close()
  }
}

/** 删除（回收）优惠券 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要回收该优惠券吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionCoupon(props.id)
    toast.success('回收成功')
    uni.$emit('mall:promotion-coupon:reload')
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
