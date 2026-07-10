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
      <yd-search-picker ref="channelPickerRef" v-model="formData.channelCode" label="支付渠道" :dict-type="DICT_TYPE.PAY_CHANNEL_CODE" dict-kind="str" all-option all-value="" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商户单号
        </view>
        <wd-input v-model="formData.merchantOrderId" placeholder="请输入商户单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          支付单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入支付单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          渠道单号
        </view>
        <wd-input v-model="formData.channelOrderNo" placeholder="请输入渠道单号" clearable />
      </view>
      <yd-search-picker ref="statusPickerRef" v-model="formData.status" label="支付状态" :dict-type="DICT_TYPE.PAY_ORDER_STATUS" all-option />
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
const channelPickerRef = ref<YdSearchPickerExpose>()
const statusPickerRef = ref<YdSearchPickerExpose>()
const formData = reactive({
  appId: 0,
  channelCode: '',
  merchantOrderId: undefined as string | undefined,
  no: undefined as string | undefined,
  channelOrderNo: undefined as string | undefined,
  status: -1,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.appId) {
    conditions.push(`应用:${appPickerRef.value?.format(formData.appId) || formData.appId}`)
  }
  if (formData.channelCode) {
    conditions.push(`渠道:${channelPickerRef.value?.format(formData.channelCode) || formData.channelCode}`)
  }
  if (formData.merchantOrderId) {
    conditions.push(`商户单号:${formData.merchantOrderId}`)
  }
  if (formData.no) {
    conditions.push(`支付单号:${formData.no}`)
  }
  if (formData.channelOrderNo) {
    conditions.push(`渠道单号:${formData.channelOrderNo}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${statusPickerRef.value?.format(formData.status) || formData.status}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索支付订单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    appId: formData.appId ? Number(formData.appId) : undefined,
    channelCode: formData.channelCode || undefined,
    merchantOrderId: formData.merchantOrderId || undefined,
    no: formData.no || undefined,
    channelOrderNo: formData.channelOrderNo || undefined,
    status: formData.status === -1 ? undefined : formData.status,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.appId = 0
  formData.channelCode = ''
  formData.merchantOrderId = undefined
  formData.no = undefined
  formData.channelOrderNo = undefined
  formData.status = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
