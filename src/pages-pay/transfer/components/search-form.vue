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
          转账单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入转账单号" clearable />
      </view>
      <yd-search-picker v-model="formData.channelCode" label="转账渠道" :dict-type="DICT_TYPE.PAY_CHANNEL_CODE" dict-kind="str" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商户单号
        </view>
        <wd-input v-model="formData.merchantOrderId" placeholder="请输入商户单号" clearable />
      </view>
      <yd-search-picker v-model="formData.status" label="转账状态" :dict-type="DICT_TYPE.PAY_TRANSFER_STATUS" dict-kind="str" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          收款人姓名
        </view>
        <wd-input v-model="formData.userName" placeholder="请输入收款人姓名" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          收款人账号
        </view>
        <wd-input v-model="formData.userAccount" placeholder="请输入收款人账号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          渠道单号
        </view>
        <wd-input v-model="formData.channelTransferNo" placeholder="请输入渠道单号" clearable />
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
  channelCode: undefined as string | undefined,
  merchantOrderId: undefined as string | undefined,
  status: undefined as string | undefined,
  userName: undefined as string | undefined,
  userAccount: undefined as string | undefined,
  channelTransferNo: undefined as string | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.channelCode !== undefined) {
    conditions.push(`渠道:${getDictLabel(DICT_TYPE.PAY_CHANNEL_CODE, formData.channelCode)}`)
  }
  if (formData.merchantOrderId) {
    conditions.push(`商户单号:${formData.merchantOrderId}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.PAY_TRANSFER_STATUS, formData.status)}`)
  }
  if (formData.userName) {
    conditions.push(`收款人:${formData.userName}`)
  }
  if (formData.userAccount) {
    conditions.push(`账号:${formData.userAccount}`)
  }
  if (formData.channelTransferNo) {
    conditions.push(`渠道单号:${formData.channelTransferNo}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索转账单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    channelCode: formData.channelCode,
    merchantOrderId: formData.merchantOrderId || undefined,
    status: formData.status,
    userName: formData.userName || undefined,
    userAccount: formData.userAccount || undefined,
    channelTransferNo: formData.channelTransferNo || undefined,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.channelCode = undefined
  formData.merchantOrderId = undefined
  formData.status = undefined
  formData.userName = undefined
  formData.userAccount = undefined
  formData.channelTransferNo = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
