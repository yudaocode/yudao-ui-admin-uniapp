<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="交易配置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 分组 tab -->
    <view class="bg-white">
      <wd-tabs v-model="activeTab" slidable="always">
        <wd-tab v-for="(tab, index) in CONFIG_TABS" :key="index" :title="tab" />
      </wd-tabs>
    </view>

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <view class="p-24rpx">
          <!-- 售后配置 -->
          <view v-show="activeTab === 0" class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-cell-group border>
              <wd-form-item title="退款理由" title-width="200rpx">
                <view class="w-full py-8rpx">
                  <view v-for="(_, i) in formData.afterSaleRefundReasons" :key="i" class="mb-12rpx flex items-center gap-16rpx">
                    <wd-input v-model="formData.afterSaleRefundReasons[i]" class="flex-1" placeholder="请输入退款理由" />
                    <text class="shrink-0 text-26rpx text-[#fa4350]" @click="formData.afterSaleRefundReasons.splice(i, 1)">删除</text>
                  </view>
                  <wd-button size="small" variant="plain" @click="formData.afterSaleRefundReasons.push('')">
                    + 添加退款理由
                  </wd-button>
                </view>
              </wd-form-item>
              <wd-form-item title="退货理由" title-width="200rpx">
                <view class="w-full py-8rpx">
                  <view v-for="(_, i) in formData.afterSaleReturnReasons" :key="i" class="mb-12rpx flex items-center gap-16rpx">
                    <wd-input v-model="formData.afterSaleReturnReasons[i]" class="flex-1" placeholder="请输入退货理由" />
                    <text class="shrink-0 text-26rpx text-[#fa4350]" @click="formData.afterSaleReturnReasons.splice(i, 1)">删除</text>
                  </view>
                  <wd-button size="small" variant="plain" @click="formData.afterSaleReturnReasons.push('')">
                    + 添加退货理由
                  </wd-button>
                </view>
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 配送配置 -->
          <view v-show="activeTab === 1" class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-cell-group border>
              <wd-form-item title="启用包邮" title-width="200rpx" prop="deliveryExpressFreeEnabled" center>
                <wd-switch v-model="formData.deliveryExpressFreeEnabled" />
              </wd-form-item>
              <wd-form-item title="满额包邮(元)" title-width="200rpx" prop="deliveryExpressFreePrice" center>
                <wd-input-number v-model="formData.deliveryExpressFreePrice" :min="0" :step="0.01" :precision="2" />
              </wd-form-item>
              <wd-form-item title="启用门店自提" title-width="200rpx" prop="deliveryPickUpEnabled" center>
                <wd-switch v-model="formData.deliveryPickUpEnabled" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 分销配置 -->
          <view v-show="activeTab === 2" class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-cell-group border>
              <wd-form-item title="分销启用" title-width="200rpx" prop="brokerageEnabled" center>
                <wd-switch v-model="formData.brokerageEnabled" />
              </wd-form-item>
              <wd-form-item title="分佣模式" title-width="200rpx" prop="brokerageEnabledCondition" center>
                <wd-radio-group v-model="formData.brokerageEnabledCondition" type="button">
                  <wd-radio
                    v-for="option in getIntDictOptions(DICT_TYPE.BROKERAGE_ENABLED_CONDITION)"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <wd-form-item title="绑定模式" title-width="200rpx" prop="brokerageBindMode" center>
                <wd-radio-group v-model="formData.brokerageBindMode" type="button">
                  <wd-radio
                    v-for="option in getIntDictOptions(DICT_TYPE.BROKERAGE_BIND_MODE)"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <wd-form-item title="一级返佣(%)" title-width="200rpx" prop="brokerageFirstPercent" center>
                <wd-input-number v-model="formData.brokerageFirstPercent" :min="0" :max="100" />
              </wd-form-item>
              <wd-form-item title="二级返佣(%)" title-width="200rpx" prop="brokerageSecondPercent" center>
                <wd-input-number v-model="formData.brokerageSecondPercent" :min="0" :max="100" />
              </wd-form-item>
              <wd-form-item title="冻结天数" title-width="200rpx" prop="brokerageFrozenDays" center>
                <wd-input-number v-model="formData.brokerageFrozenDays" :min="0" />
              </wd-form-item>
              <wd-form-item title="提现门槛(元)" title-width="200rpx" prop="brokerageWithdrawMinPrice" center>
                <wd-input-number v-model="formData.brokerageWithdrawMinPrice" :min="0" :step="0.01" :precision="2" />
              </wd-form-item>
              <wd-form-item title="提现手续费(%)" title-width="200rpx" prop="brokerageWithdrawFeePercent" center>
                <wd-input-number v-model="formData.brokerageWithdrawFeePercent" :min="0" :max="100" />
              </wd-form-item>
              <wd-form-item title="提现方式" title-width="200rpx" prop="brokerageWithdrawTypes">
                <wd-checkbox-group v-model="formData.brokerageWithdrawTypes" type="button">
                  <wd-checkbox
                    v-for="option in getIntDictOptions(DICT_TYPE.BROKERAGE_WITHDRAW_TYPE)"
                    :key="option.value"
                    :name="option.value"
                  >
                    {{ option.label }}
                  </wd-checkbox>
                </wd-checkbox-group>
              </wd-form-item>
              <wd-form-item title="分销海报" title-width="200rpx">
                <yd-upload-imgs v-model="formData.brokeragePosterUrls" :limit="9" />
              </wd-form-item>
            </wd-cell-group>
          </view>
        </view>
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
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getTradeConfig, saveTradeConfig } from '@/api/mall/trade/config'
import { getIntDictOptions } from '@/hooks/useDict'
import { fenToYuan, yuanToFen } from '@/utils/format'
import { navigateBackPlus, trimArray } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

interface TradeConfigForm {
  afterSaleRefundReasons: string[]
  afterSaleReturnReasons: string[]
  deliveryExpressFreeEnabled: boolean
  deliveryExpressFreePrice: number
  deliveryPickUpEnabled: boolean
  brokerageEnabled: boolean
  brokerageEnabledCondition?: number
  brokerageBindMode?: number
  brokerageFirstPercent: number
  brokerageSecondPercent: number
  brokerageFrozenDays: number
  brokerageWithdrawMinPrice: number
  brokerageWithdrawFeePercent: number
  brokerageWithdrawTypes: number[]
  brokeragePosterUrls: string[]
}

const CONFIG_TABS = ['售后', '配送', '分销'] // 分组 tab

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const formLoading = ref(false) // 表单提交状态
const activeTab = ref(0) // 当前分组 tab 下标
const formData = ref<TradeConfigForm>({
  afterSaleRefundReasons: [],
  afterSaleReturnReasons: [],
  deliveryExpressFreeEnabled: false,
  deliveryExpressFreePrice: 0,
  deliveryPickUpEnabled: false,
  brokerageEnabled: false,
  brokerageEnabledCondition: 1,
  brokerageBindMode: 1,
  brokerageFirstPercent: 0,
  brokerageSecondPercent: 0,
  brokerageFrozenDays: 0,
  brokerageWithdrawMinPrice: 0,
  brokerageWithdrawFeePercent: 0,
  brokerageWithdrawTypes: [],
  brokeragePosterUrls: [],
}) // 表单数据
const formSchema = createFormSchema({
  deliveryExpressFreePrice: [{ required: true, message: '满额包邮不能为空' }],
  brokerageEnabledCondition: [{ required: true, message: '分佣模式不能为空' }],
  brokerageBindMode: [{ required: true, message: '绑定模式不能为空' }],
  brokerageFirstPercent: [{ required: true, message: '一级返佣比例不能为空' }],
  brokerageSecondPercent: [{ required: true, message: '二级返佣比例不能为空' }],
  brokerageFrozenDays: [{ required: true, message: '佣金冻结天数不能为空' }],
  brokerageWithdrawMinPrice: [{ required: true, message: '提现门槛不能为空' }],
  brokerageWithdrawFeePercent: [{ required: true, message: '提现手续费不能为空' }],
  brokerageWithdrawTypes: [{ required: true, message: '提现方式不能为空' }],
})

/** 字段 → tab 映射（校验失败时切到对应 tab） */
const PROP_TAB: Record<string, number> = {
  deliveryExpressFreePrice: 1,
  brokerageEnabledCondition: 2,
  brokerageBindMode: 2,
  brokerageFirstPercent: 2,
  brokerageSecondPercent: 2,
  brokerageFrozenDays: 2,
  brokerageWithdrawMinPrice: 2,
  brokerageWithdrawFeePercent: 2,
  brokerageWithdrawTypes: 2,
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mall/home/index')
}

/** 加载配置 */
async function loadConfig() {
  const data = await getTradeConfig()
  if (!data) {
    return
  }
  formData.value = {
    ...data,
    afterSaleRefundReasons: data.afterSaleRefundReasons || [],
    afterSaleReturnReasons: data.afterSaleReturnReasons || [],
    deliveryExpressFreeEnabled: !!data.deliveryExpressFreeEnabled,
    deliveryExpressFreePrice: fenToYuan(data.deliveryExpressFreePrice),
    deliveryPickUpEnabled: !!data.deliveryPickUpEnabled,
    brokerageEnabled: !!data.brokerageEnabled,
    brokerageEnabledCondition: data.brokerageEnabledCondition ?? 1,
    brokerageBindMode: data.brokerageBindMode ?? 1,
    brokerageFirstPercent: data.brokerageFirstPercent ?? 0,
    brokerageSecondPercent: data.brokerageSecondPercent ?? 0,
    brokerageFrozenDays: data.brokerageFrozenDays ?? 0,
    brokerageWithdrawMinPrice: fenToYuan(data.brokerageWithdrawMinPrice),
    brokerageWithdrawFeePercent: data.brokerageWithdrawFeePercent ?? 0,
    brokerageWithdrawTypes: data.brokerageWithdrawTypes || [],
    brokeragePosterUrls: data.brokeragePosterUrls || [],
  }
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value.validate()
  if (!result?.valid) {
    // 校验失败时切到首个错误字段所在的 tab
    const prop = result?.errors?.[0]?.prop
    if (prop != null && PROP_TAB[prop] != null) {
      activeTab.value = PROP_TAB[prop]
    }
    return
  }
  formLoading.value = true
  try {
    await saveTradeConfig({
      afterSaleRefundReasons: trimArray(formData.value.afterSaleRefundReasons),
      afterSaleReturnReasons: trimArray(formData.value.afterSaleReturnReasons),
      deliveryExpressFreeEnabled: formData.value.deliveryExpressFreeEnabled,
      deliveryExpressFreePrice: yuanToFen(formData.value.deliveryExpressFreePrice),
      deliveryPickUpEnabled: formData.value.deliveryPickUpEnabled,
      brokerageEnabled: formData.value.brokerageEnabled,
      brokerageEnabledCondition: formData.value.brokerageEnabledCondition,
      brokerageBindMode: formData.value.brokerageBindMode,
      brokerageFirstPercent: formData.value.brokerageFirstPercent,
      brokerageSecondPercent: formData.value.brokerageSecondPercent,
      brokerageFrozenDays: formData.value.brokerageFrozenDays,
      brokerageWithdrawMinPrice: yuanToFen(formData.value.brokerageWithdrawMinPrice),
      brokerageWithdrawFeePercent: formData.value.brokerageWithdrawFeePercent,
      brokerageWithdrawTypes: formData.value.brokerageWithdrawTypes,
      brokeragePosterUrls: formData.value.brokeragePosterUrls,
    })
    toast.success('保存成功')
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadConfig()
})
</script>
