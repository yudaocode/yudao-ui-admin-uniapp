<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="模板名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入模板名称" />
          </wd-form-item>
          <wd-form-item title="发放数量" title-width="200rpx" prop="totalCount" center>
            <view class="w-full flex items-center justify-between">
              <wd-input-number v-model="formData.totalCount" :min="-1" />
              <text class="text-24rpx text-[#999]">-1 不限</text>
            </view>
          </wd-form-item>
          <wd-form-item title="每人限领" title-width="200rpx" prop="takeLimitCount" center>
            <wd-input-number v-model="formData.takeLimitCount" :min="-1" />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.takeType"
            label="领取方式"
            label-width="200rpx"
            prop="takeType"
            :dict-type="DICT_TYPE.PROMOTION_COUPON_TAKE_TYPE"
            placeholder="请选择领取方式"
          />
          <wd-form-item title="使用门槛(元)" title-width="200rpx" prop="usePrice" center>
            <wd-input-number v-model="formData.usePrice" :min="0" :step="0.01" :precision="2" />
          </wd-form-item>

          <!-- 商品范围 -->
          <yd-form-picker
            v-model="formData.productScope"
            label="商品范围"
            label-width="200rpx"
            prop="productScope"
            :dict-type="DICT_TYPE.PROMOTION_PRODUCT_SCOPE"
            placeholder="请选择商品范围"
          />
          <wd-form-item v-if="formData.productScope !== PromotionProductScopeEnum.ALL" :title="formData.productScope === PromotionProductScopeEnum.CATEGORY ? '指定分类' : '指定商品'" title-width="200rpx">
            <ScopePicker v-model="formData.productScopeValues" :scope="formData.productScope!" />
          </wd-form-item>

          <!-- 优惠类型相关 -->
          <wd-form-item title="优惠类型" title-width="200rpx" prop="discountType" center>
            <wd-radio-group v-model="formData.discountType" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_DISCOUNT_TYPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item v-if="formData.discountType === PromotionDiscountTypeEnum.PRICE" title="优惠金额(元)" title-width="200rpx" prop="discountPrice" center>
            <wd-input-number v-model="formData.discountPrice" :min="0" :step="0.01" :precision="2" />
          </wd-form-item>
          <template v-else-if="formData.discountType === PromotionDiscountTypeEnum.PERCENT">
            <wd-form-item title="折扣百分比" title-width="200rpx" prop="discountPercent" center>
              <wd-input-number v-model="formData.discountPercent" :min="1" :max="99" />
            </wd-form-item>
            <wd-form-item title="最多优惠(元)" title-width="200rpx" prop="discountLimitPrice" center>
              <wd-input-number v-model="formData.discountLimitPrice" :min="0" :step="0.01" :precision="2" />
            </wd-form-item>
          </template>

          <!-- 有效期相关 -->
          <wd-form-item title="有效期类型" title-width="200rpx" prop="validityType" center>
            <wd-radio-group v-model="formData.validityType" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_COUPON_TEMPLATE_VALIDITY_TYPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <template v-if="formData.validityType === CouponTemplateValidityTypeEnum.DATE">
            <wd-form-item title="固定开始" title-width="200rpx" prop="validStartTime" is-link placeholder="请选择固定开始时间" :value="formatDateTime(formData.validStartTime)" @click="pickerVisible.validStartTime = true" />
            <wd-datetime-picker v-model="formData.validStartTime" v-model:visible="pickerVisible.validStartTime" title="请选择固定开始时间" type="datetime" />
            <wd-form-item title="固定结束" title-width="200rpx" prop="validEndTime" is-link placeholder="请选择固定结束时间" :value="formatDateTime(formData.validEndTime)" @click="pickerVisible.validEndTime = true" />
            <wd-datetime-picker v-model="formData.validEndTime" v-model:visible="pickerVisible.validEndTime" title="请选择固定结束时间" type="datetime" />
          </template>
          <template v-else-if="formData.validityType === CouponTemplateValidityTypeEnum.TERM">
            <wd-form-item title="领取后生效(天)" title-width="200rpx" prop="fixedStartTerm" center>
              <wd-input-number v-model="formData.fixedStartTerm" :min="0" />
            </wd-form-item>
            <wd-form-item title="有效天数" title-width="200rpx" prop="fixedEndTerm" center>
              <wd-input-number v-model="formData.fixedEndTerm" :min="0" />
            </wd-form-item>
          </template>

          <wd-form-item title="状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { PromotionCouponTemplate } from '@/api/mall/promotion/coupon/coupon-template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionCouponTemplate,
  getPromotionCouponTemplate,
  updatePromotionCouponTemplate,
} from '@/api/mall/promotion/coupon/coupon-template'
import { getIntDictOptions } from '@/hooks/useDict'
import ScopePicker from '@/pages-mall/promotion/components/scope-picker.vue'
import { fenToYuan, yuanToFen } from '@/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, CouponTemplateTakeTypeEnum, CouponTemplateValidityTypeEnum, DICT_TYPE, PromotionDiscountTypeEnum, PromotionProductScopeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑优惠券模板' : '新增优惠券模板')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const formData = ref<PromotionCouponTemplate>({
  id: undefined,
  name: '',
  totalCount: -1,
  takeLimitCount: 1,
  takeType: CouponTemplateTakeTypeEnum.USER,
  usePrice: 0,
  productScope: PromotionProductScopeEnum.ALL,
  productScopeValues: [],
  discountType: PromotionDiscountTypeEnum.PRICE,
  discountPrice: 0,
  discountPercent: 0,
  discountLimitPrice: 0,
  validityType: CouponTemplateValidityTypeEnum.DATE,
  validStartTime: undefined,
  validEndTime: undefined,
  fixedStartTerm: 0,
  fixedEndTerm: 7,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '模板名称不能为空' }],
  totalCount: [{ required: true, message: '发放数量不能为空' }],
  takeType: [{ required: true, message: '领取方式不能为空' }],
  discountType: [{ required: true, message: '优惠类型不能为空' }],
  validityType: [{ required: true, message: '有效期类型不能为空' }],
  validStartTime: [{ required: (model: Record<string, any>) => model.validityType === CouponTemplateValidityTypeEnum.DATE, message: '固定开始时间不能为空' }],
  validEndTime: [{ required: (model: Record<string, any>) => model.validityType === CouponTemplateValidityTypeEnum.DATE, message: '固定结束时间不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/coupon/template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPromotionCouponTemplate(props.id)
  formData.value = {
    ...data,
    productScopeValues: data.productScopeValues || [],
    usePrice: fenToYuan(data.usePrice),
    discountPrice: fenToYuan(data.discountPrice),
    discountLimitPrice: fenToYuan(data.discountLimitPrice),
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 非「全部」商品范围时，必须选择至少一个指定商品/分类
  if (formData.value.productScope !== PromotionProductScopeEnum.ALL && !formData.value.productScopeValues?.length) {
    toast.warning(formData.value.productScope === PromotionProductScopeEnum.CATEGORY ? '请选择指定分类' : '请选择指定商品')
    return
  }
  formLoading.value = true
  try {
    const isUserTake = formData.value.takeType === CouponTemplateTakeTypeEnum.USER
    const data: PromotionCouponTemplate = {
      ...formData.value,
      // 非「直接领取」（指定发放/新人券）发放数量与每人限领锁 -1（不限）
      totalCount: isUserTake ? formData.value.totalCount : -1,
      takeLimitCount: isUserTake ? formData.value.takeLimitCount : -1,
      usePrice: yuanToFen(formData.value.usePrice),
      discountPrice: yuanToFen(formData.value.discountPrice),
      discountLimitPrice: yuanToFen(formData.value.discountLimitPrice),
    }
    if (props.id) {
      await updatePromotionCouponTemplate(data)
      toast.success('修改成功')
    } else {
      await createPromotionCouponTemplate(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-coupon-template:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
