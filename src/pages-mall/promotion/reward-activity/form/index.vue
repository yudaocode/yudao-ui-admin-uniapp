<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <view class="p-24rpx">
          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              活动信息
            </view>
            <wd-cell-group border>
              <wd-form-item title="活动名称" title-width="200rpx" prop="name">
                <wd-input v-model="formData.name" clearable placeholder="请输入活动名称" />
              </wd-form-item>
              <wd-form-item title="开始时间" title-width="200rpx" prop="startTime" is-link placeholder="请选择开始时间" :value="formatDateTime(formData.startTime)" @click="pickerVisible.startTime = true" />
              <wd-datetime-picker v-model="formData.startTime" v-model:visible="pickerVisible.startTime" title="请选择开始时间" type="datetime" />
              <wd-form-item title="结束时间" title-width="200rpx" prop="endTime" is-link placeholder="请选择结束时间" :value="formatDateTime(formData.endTime)" @click="pickerVisible.endTime = true" />
              <wd-datetime-picker v-model="formData.endTime" v-model:visible="pickerVisible.endTime" title="请选择结束时间" type="datetime" />
              <wd-form-item title="条件类型" title-width="200rpx" prop="conditionType" center>
                <wd-radio-group v-model="formData.conditionType" type="button">
                  <wd-radio
                    v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_CONDITION_TYPE)"
                    :key="dict.value"
                    :value="dict.value"
                  >
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <yd-form-picker
                v-model="formData.productScope"
                label="商品范围"
                label-width="200rpx"
                prop="productScope"
                :dict-type="DICT_TYPE.PROMOTION_PRODUCT_SCOPE"
                placeholder="请选择商品范围"
              />
              <wd-form-item v-if="formData.productScope !== PromotionProductScopeEnum.ALL" :title="formData.productScope === PromotionProductScopeEnum.CATEGORY ? '指定分类' : '指定商品'" title-width="200rpx">
                <ScopePicker v-model="scopeValues" :scope="formData.productScope!" />
              </wd-form-item>
              <wd-form-item title="备注" title-width="200rpx">
                <wd-textarea v-model="formData.remark" clearable :maxlength="500" placeholder="请输入备注" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 优惠规则 -->
          <view class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-18rpx">
              <text class="text-30rpx text-[#333] font-semibold">优惠规则</text>
              <wd-button size="small" type="primary" variant="plain" @click="addRule">
                添加
              </wd-button>
            </view>
            <view v-for="(rule, index) in rules" :key="index" class="border-b border-[#f5f5f5] p-24rpx">
              <view class="mb-12rpx flex items-center justify-between">
                <text class="text-28rpx text-[#333]">规则 {{ index + 1 }}</text>
                <text class="text-26rpx text-[#fa4350]" @click="removeRule(index)">删除</text>
              </view>
              <view class="flex items-center gap-12rpx py-6rpx">
                <text class="w-180rpx shrink-0 text-26rpx text-[#666]">{{ formData.conditionType === PromotionConditionTypeEnum.COUNT ? '满件数' : '满金额(元)' }}</text>
                <wd-input-number v-model="rule.limit" :min="0" :step="formData.conditionType === PromotionConditionTypeEnum.COUNT ? 1 : 0.01" />
              </view>
              <view class="flex items-center gap-12rpx py-6rpx">
                <text class="w-180rpx shrink-0 text-26rpx text-[#666]">优惠金额(元)</text>
                <wd-input-number v-model="rule.discountPrice" :min="0" :step="0.01" :precision="2" />
              </view>
              <view class="flex items-center gap-12rpx py-6rpx">
                <text class="w-180rpx shrink-0 text-26rpx text-[#666]">赠送积分</text>
                <wd-input-number v-model="rule.point" :min="0" />
              </view>
              <view class="flex items-center gap-12rpx py-6rpx">
                <text class="w-180rpx shrink-0 text-26rpx text-[#666]">是否包邮</text>
                <wd-switch v-model="rule.freeDelivery" />
              </view>
              <!-- 赠送优惠券 -->
              <view class="py-6rpx">
                <view class="mb-8rpx flex items-center justify-between">
                  <text class="text-26rpx text-[#666]">赠送优惠券</text>
                  <wd-button size="small" variant="plain" @click="openCouponPicker(index)">
                    选择优惠券
                  </wd-button>
                </view>
                <view v-if="rule.coupons.length" class="flex flex-col gap-8rpx">
                  <view
                    v-for="coupon in rule.coupons"
                    :key="coupon.templateId"
                    class="flex items-center gap-12rpx"
                  >
                    <text class="min-w-0 flex-1 truncate text-26rpx text-[#333]">{{ couponLabel(coupon.templateId) }}</text>
                    <wd-input-number v-model="coupon.count" :min="1" />
                    <text class="shrink-0 text-26rpx text-[#fa4350]" @click="removeCoupon(index, coupon.templateId)">移除</text>
                  </view>
                </view>
                <text v-else class="text-24rpx text-[#999]">未选择优惠券</text>
              </view>
            </view>
          </view>
        </view>
      </wd-form>
    </scroll-view>

    <!-- 赠送优惠券选择弹窗 -->
    <wd-popup
      v-model="couponPickerVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0; height: 70vh;"
      @close="couponPickerVisible = false"
    >
      <view class="box-border h-full flex flex-col overflow-hidden p-24rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
          选择赠送优惠券
        </view>
        <z-paging
          ref="couponPagingRef"
          v-model="couponTemplates"
          :fixed="false"
          class="min-h-0 flex-1"
          :default-page-size="20"
          :refresher-enabled="true"
          :inside-more="true"
          :loading-more-default-as-loading="true"
          empty-view-text="暂无优惠券模板"
          @query="queryCouponTemplates"
        >
          <wd-checkbox-group v-model="couponTempSelected">
            <wd-checkbox
              v-for="template in couponTemplates"
              :key="template.id"
              :name="template.id"
              class="border-b border-[#f5f5f5] py-16rpx"
            >
              {{ template.name }}
            </wd-checkbox>
          </wd-checkbox-group>
        </z-paging>
        <view class="mt-16rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="couponPickerVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="confirmCouponPicker">
            确定（{{ couponTempSelected.length }}）
          </wd-button>
        </view>
      </view>
    </wd-popup>

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
import type { PromotionRewardActivity } from '@/api/mall/promotion/reward'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getPromotionCouponTemplateList, getPromotionCouponTemplatePage } from '@/api/mall/promotion/coupon/coupon-template'
import {
  createPromotionRewardActivity,
  getPromotionRewardActivity,
  updatePromotionRewardActivity,
} from '@/api/mall/promotion/reward'
import { getIntDictOptions } from '@/hooks/useDict'
import ScopePicker from '@/pages-mall/promotion/components/scope-picker.vue'
import { fenToYuan, yuanToFen } from '@/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, PromotionConditionTypeEnum, PromotionProductScopeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

/** 单条规则赠送的优惠券（模板编号 + 数量） */
interface RewardRuleCoupon { templateId: number, count: number }
/** 表单内的规则结构（金额为元） */
interface RewardRuleForm { limit: number, discountPrice: number, point: number, freeDelivery: boolean, coupons: RewardRuleCoupon[] }

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑满减送' : '新增满减送')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const scopeValues = ref<number[]>([]) // 指定商品/分类编号
const rules = ref<RewardRuleForm[]>([createRule()]) // 优惠规则（金额为元）
const couponTemplates = ref<PromotionCouponTemplate[]>([]) // 优惠券模板列表（用于选择 + 名称回显）
const couponTemplateMap = ref(new Map<number, PromotionCouponTemplate>()) // 优惠券模板映射
const couponPagingRef = ref<ZPagingRef<PromotionCouponTemplate>>() // 优惠券分页组件引用
const couponPickerVisible = ref(false) // 优惠券选择弹窗显示状态
const couponTempSelected = ref<number[]>([]) // 弹窗内临时选中的优惠券模板编号
const couponEditingIndex = ref(-1) // 当前编辑赠券的规则下标
const formData = ref<PromotionRewardActivity>({
  id: undefined,
  name: '',
  startTime: undefined,
  endTime: undefined,
  conditionType: PromotionConditionTypeEnum.PRICE,
  productScope: PromotionProductScopeEnum.ALL,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '活动名称不能为空' }],
  startTime: [{ required: true, message: '开始时间不能为空' }],
  endTime: [{ required: true, message: '结束时间不能为空' }],
})

/** 创建一条空规则 */
function createRule(): RewardRuleForm {
  return { limit: 0, discountPrice: 0, point: 0, freeDelivery: false, coupons: [] }
}

/** 添加优惠规则 */
function addRule() {
  rules.value.push(createRule())
}

/** 删除优惠规则 */
function removeRule(index: number) {
  rules.value.splice(index, 1)
}

/** 优惠券模板名称 */
function couponLabel(templateId: number) {
  return couponTemplateMap.value.get(templateId)?.name || `模板 #${templateId}`
}

/** 打开赠券选择弹窗 */
function openCouponPicker(index: number) {
  couponEditingIndex.value = index
  couponTempSelected.value = rules.value[index].coupons.map(item => item.templateId)
  couponPickerVisible.value = true
  couponPagingRef.value?.reload()
}

/** 确认赠券选择：保留已有数量，新增默认 1 */
function confirmCouponPicker() {
  const rule = rules.value[couponEditingIndex.value]
  if (rule) {
    rule.coupons = couponTempSelected.value.map((templateId) => {
      const exist = rule.coupons.find(item => item.templateId === templateId)
      return { templateId, count: exist?.count ?? 1 }
    })
  }
  couponPickerVisible.value = false
}

/** 移除单个赠券 */
function removeCoupon(ruleIndex: number, templateId: number) {
  const rule = rules.value[ruleIndex]
  rule.coupons = rule.coupons.filter(item => item.templateId !== templateId)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/reward-activity/index')
}

/** 查询赠券候选（仅「后台指定发放」ADMIN=2 类型） */
async function queryCouponTemplates(pageNo: number, pageSize: number) {
  try {
    const data = await getPromotionCouponTemplatePage({ pageNo, pageSize, canTakeTypes: [2] })
    data.list.forEach((item) => {
      if (item.id != null) {
        couponTemplateMap.value.set(item.id, item)
      }
    })
    couponPagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    couponPagingRef.value?.complete(false)
  }
}

/** 补全已选赠券模板（编辑回显：已选模板可能不在候选首页，按 ids 拉取合并） */
async function ensureSelectedCouponTemplates() {
  const selectedIds = new Set<number>()
  rules.value.forEach(rule => rule.coupons.forEach(coupon => selectedIds.add(coupon.templateId)))
  const missing = Array.from(selectedIds).filter(id => !couponTemplateMap.value.has(id))
  if (!missing.length) {
    return
  }
  const extra = await getPromotionCouponTemplateList(missing)
  extra.forEach((item) => {
    if (item.id != null) {
      couponTemplateMap.value.set(item.id, item)
    }
  })
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPromotionRewardActivity(Number(props.id))
  formData.value = {
    ...data,
    conditionType: data.conditionType ?? PromotionConditionTypeEnum.PRICE,
    productScope: data.productScope ?? PromotionProductScopeEnum.ALL,
  }
  scopeValues.value = data.productScopeValues || []
  if (data.rules?.length) {
    // 满金额时 limit 为分，需转元；满件数时 limit 为整数。赠券 Map 转为本地数组结构
    rules.value = data.rules.map(rule => ({
      limit: data.conditionType === PromotionConditionTypeEnum.COUNT ? (rule.limit ?? 0) : fenToYuan(rule.limit),
      discountPrice: fenToYuan(rule.discountPrice),
      point: rule.point ?? 0,
      freeDelivery: !!rule.freeDelivery,
      coupons: Object.entries(rule.giveCouponTemplateCounts || {}).map(([templateId, count]) => ({
        templateId: Number(templateId),
        count: Number(count) || 1,
      })),
    }))
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!rules.value.length) {
    toast.warning('请至少添加一条优惠规则')
    return
  }
  // 非「全部」商品范围时，必须选择至少一个指定商品/分类
  if (formData.value.productScope !== PromotionProductScopeEnum.ALL && !scopeValues.value.length) {
    toast.warning(formData.value.productScope === PromotionProductScopeEnum.CATEGORY ? '请选择指定分类' : '请选择指定商品')
    return
  }
  // 规则门槛与优惠价格必须大于 0
  if (rules.value.some(rule => !(Number(rule.limit) > 0) || !(Number(rule.discountPrice) > 0))) {
    toast.warning('优惠门槛与优惠价格需大于 0')
    return
  }
  const isCount = formData.value.conditionType === PromotionConditionTypeEnum.COUNT
  const submitRules = rules.value.map((rule) => {
    // 赠券本地数组转回后端 Map<模板编号, 数量>
    const giveCouponTemplateCounts: Record<string, number> = {}
    rule.coupons.forEach((coupon) => {
      giveCouponTemplateCounts[coupon.templateId] = Number(coupon.count) || 1
    })
    return {
      limit: isCount ? Number(rule.limit) || 0 : yuanToFen(rule.limit),
      discountPrice: yuanToFen(rule.discountPrice),
      point: Number(rule.point) || 0,
      freeDelivery: !!rule.freeDelivery,
      giveCouponTemplateCounts,
    }
  })
  const productScopeValues = formData.value.productScope === PromotionProductScopeEnum.ALL ? [] : scopeValues.value
  formLoading.value = true
  try {
    const data: PromotionRewardActivity = {
      ...formData.value,
      productScopeValues,
      rules: submitRules,
    }
    if (props.id) {
      await updatePromotionRewardActivity(data)
      toast.success('修改成功')
    } else {
      await createPromotionRewardActivity(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-reward-activity:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await getDetail()
  await ensureSelectedCouponTemplates()
})
</script>
