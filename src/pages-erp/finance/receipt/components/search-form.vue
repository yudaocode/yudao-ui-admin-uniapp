<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
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
          收款单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入收款单号" clearable />
      </view>
      <yd-search-date-range v-model="formData.receiptTime" label="收款时间" />
      <CustomerSearchPicker ref="customerPickerRef" v-model="formData.customerId" />
      <UserSearchPicker v-model="formData.creator" label="创建人" />
      <UserSearchPicker v-model="formData.financeUserId" label="财务人员" />
      <AccountSearchPicker ref="accountPickerRef" v-model="formData.accountId" label="收款账户" placeholder="请选择收款账户" />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.ERP_AUDIT_STATUS" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          销售单号
        </view>
        <wd-input v-model="formData.bizNo" placeholder="请输入销售单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          备注
        </view>
        <wd-input v-model="formData.remark" placeholder="请输入备注" clearable />
      </view>
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
import { UserSearchPicker } from '@/components/system-select'
import AccountSearchPicker from '@/pages-erp/finance/account/components/account-search-picker.vue'
import CustomerSearchPicker from '@/pages-erp/sale/customer/components/customer-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false)
const customerPickerRef = ref<InstanceType<typeof CustomerSearchPicker>>() // 客户选择器
const accountPickerRef = ref<InstanceType<typeof AccountSearchPicker>>() // 结算账户选择器
const formData = reactive({
  no: undefined as string | undefined,
  receiptTime: [undefined, undefined] as [any, any],
  customerId: undefined as number | undefined,
  creator: undefined as number | undefined,
  financeUserId: undefined as number | undefined,
  accountId: undefined as number | undefined,
  status: undefined as number | undefined,
  remark: undefined as string | undefined,
  bizNo: undefined as string | undefined,
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.receiptTime[0] && formData.receiptTime[1]) {
    conditions.push(`收款时间:${formatDate(formData.receiptTime[0])}~${formatDate(formData.receiptTime[1])}`)
  }
  if (formData.customerId) {
    conditions.push(`客户:${customerPickerRef.value?.format(formData.customerId) || formData.customerId}`)
  }
  if (formData.accountId) {
    conditions.push(`账户:${accountPickerRef.value?.format(formData.accountId) || formData.accountId}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索收款单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    receiptTime: formatDateRange(formData.receiptTime),
    customerId: formData.customerId,
    creator: formData.creator != null ? String(formData.creator) : undefined,
    financeUserId: formData.financeUserId != null ? String(formData.financeUserId) : undefined,
    accountId: formData.accountId,
    status: formData.status,
    remark: formData.remark || undefined,
    bizNo: formData.bizNo || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.receiptTime = [undefined, undefined]
  formData.customerId = undefined
  formData.creator = undefined
  formData.financeUserId = undefined
  formData.accountId = undefined
  formData.status = undefined
  formData.remark = undefined
  formData.bizNo = undefined
  visible.value = false
  emit('reset')
}
</script>
