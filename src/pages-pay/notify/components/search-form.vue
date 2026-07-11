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
      <AppSearchPicker ref="appPickerRef" v-model="formData.appId" />
      <yd-search-picker ref="typePickerRef" v-model="formData.type" label="通知类型" :dict-type="DICT_TYPE.PAY_NOTIFY_TYPE" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          关联编号
        </view>
        <wd-input v-model="formData.dataId" type="number" placeholder="请输入关联编号" clearable />
      </view>
      <yd-search-picker ref="statusPickerRef" v-model="formData.status" label="通知状态" :dict-type="DICT_TYPE.PAY_NOTIFY_STATUS" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商户订单
        </view>
        <wd-input v-model="formData.merchantOrderId" placeholder="请输入商户订单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商户退款
        </view>
        <wd-input v-model="formData.merchantRefundId" placeholder="请输入商户退款编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商户转账
        </view>
        <wd-input v-model="formData.merchantTransferId" placeholder="请输入商户转账编号" clearable />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
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
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import AppSearchPicker from '@/pages-pay/app/components/app-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const appPickerRef = ref<InstanceType<typeof AppSearchPicker>>()
const typePickerRef = ref<YdSearchPickerExpose>()
const statusPickerRef = ref<YdSearchPickerExpose>()
const formData = reactive({
  appId: undefined as number | undefined,
  type: undefined as number | undefined,
  dataId: undefined as string | undefined,
  status: undefined as number | undefined,
  merchantOrderId: undefined as string | undefined,
  merchantRefundId: undefined as string | undefined,
  merchantTransferId: undefined as string | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.appId !== undefined) {
    conditions.push(`应用:${appPickerRef.value?.format(formData.appId) || formData.appId}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${typePickerRef.value?.format(formData.type) || formData.type}`)
  }
  if (formData.dataId) {
    conditions.push(`关联:${formData.dataId}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${statusPickerRef.value?.format(formData.status) || formData.status}`)
  }
  if (formData.merchantOrderId) {
    conditions.push(`商户订单:${formData.merchantOrderId}`)
  }
  if (formData.merchantRefundId) {
    conditions.push(`商户退款:${formData.merchantRefundId}`)
  }
  if (formData.merchantTransferId) {
    conditions.push(`商户转账:${formData.merchantTransferId}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索支付通知'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    appId: formData.appId,
    type: formData.type,
    dataId: formData.dataId ? Number(formData.dataId) : undefined,
    status: formData.status,
    merchantOrderId: formData.merchantOrderId || undefined,
    merchantRefundId: formData.merchantRefundId || undefined,
    merchantTransferId: formData.merchantTransferId || undefined,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.appId = undefined
  formData.type = undefined
  formData.dataId = undefined
  formData.status = undefined
  formData.merchantOrderId = undefined
  formData.merchantRefundId = undefined
  formData.merchantTransferId = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
