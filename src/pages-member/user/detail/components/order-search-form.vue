<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          订单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入订单号" clearable />
      </view>
      <yd-search-picker v-model="formData.status" label="订单状态" :dict-type="DICT_TYPE.TRADE_ORDER_STATUS" all-option />
      <yd-search-picker v-model="formData.payChannelCode" label="支付方式" :dict-type="DICT_TYPE.PAY_CHANNEL_CODE" dict-kind="str" all-option />
      <yd-search-picker v-model="formData.terminal" label="订单来源" :dict-type="DICT_TYPE.TERMINAL" all-option />
      <yd-search-picker v-model="formData.type" label="订单类型" :dict-type="DICT_TYPE.TRADE_ORDER_TYPE" all-option />
      <yd-search-picker v-model="formData.deliveryType" label="配送方式" :dict-type="DICT_TYPE.TRADE_DELIVERY_TYPE" all-option />
      <yd-search-date-range v-model="formData.createTime" label="下单时间" />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  no: undefined as string | undefined,
  status: undefined as number | undefined,
  type: undefined as number | undefined,
  deliveryType: undefined as number | undefined,
  payChannelCode: undefined as string | undefined,
  terminal: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`订单:${formData.no}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.TRADE_ORDER_STATUS, formData.status)}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.TRADE_ORDER_TYPE, formData.type)}`)
  }
  if (formData.deliveryType !== undefined) {
    conditions.push(`配送:${getDictLabel(DICT_TYPE.TRADE_DELIVERY_TYPE, formData.deliveryType)}`)
  }
  if (formData.payChannelCode !== undefined) {
    conditions.push(`支付:${getDictLabel(DICT_TYPE.PAY_CHANNEL_CODE, formData.payChannelCode)}`)
  }
  if (formData.terminal !== undefined) {
    conditions.push(`来源:${getDictLabel(DICT_TYPE.TERMINAL, formData.terminal)}`)
  }
  if (formData.createTime[0] && formData.createTime[1]) {
    conditions.push(`下单:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索订单记录'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    status: formData.status,
    type: formData.type,
    deliveryType: formData.deliveryType,
    payChannelCode: formData.payChannelCode,
    terminal: formData.terminal,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.status = undefined
  formData.type = undefined
  formData.deliveryType = undefined
  formData.payChannelCode = undefined
  formData.terminal = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
