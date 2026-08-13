<template>
  <!-- 整理凭证弹窗 -->
  <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        整理凭证
      </view>

      <view class="mb-24rpx flex items-center justify-between" @click="monthVisible = true">
        <text class="text-28rpx text-[#666]">整理范围</text>
        <view class="flex items-center gap-8rpx">
          <text class="text-28rpx text-[#333]">{{ formData.month || '请选择月份' }}</text>
          <wd-icon name="arrow-right" size="28rpx" color="#999" />
        </view>
      </view>
      <wd-datetime-picker
        v-model="monthPicker"
        v-model:visible="monthVisible"
        title="请选择整理月份"
        type="year-month"
        @confirm="handleMonthConfirm"
      />

      <view class="mb-24rpx">
        <view class="mb-16rpx text-28rpx text-[#666]">
          凭证字
        </view>
        <VoucherWordRadioGroup v-model="formData.voucherWordId" />
      </view>

      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-28rpx text-[#666]">起始编号</text>
        <wd-input-number v-model="formData.startNumber" :min="1" :precision="0" />
      </view>

      <view class="mb-32rpx">
        <view class="mb-16rpx text-28rpx text-[#666]">
          整理方式
        </view>
        <wd-radio-group v-model="formData.type">
          <view v-for="option in FmsVoucherTidyTypeOptions" :key="option.value" class="mb-12rpx">
            <wd-radio :value="option.value">
              {{ option.label }}
            </wd-radio>
          </view>
        </wd-radio-group>
      </view>

      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        确 定
      </wd-button>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { VoucherTidyReq } from '@/api/fms/voucher'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { tidyVoucher } from '@/api/fms/voucher'
import VoucherWordRadioGroup from '@/pages-fms/config/voucher-word/components/voucher-word-radio-group.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsVoucherTidyType, FmsVoucherTidyTypeOptions } from '@/pages-fms/utils/constants'
import { formatFmsMonth, parseFmsMonth } from '@/pages-fms/utils/format'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const toast = useToast()
const fmsStore = useFmsStore()
const visible = ref(false) // 弹窗显隐
const formLoading = ref(false) // 表单提交状态
const monthVisible = ref(false) // 月份选择器显隐
const monthPicker = ref<number | string>('') // 月份本地值
const formData = ref<VoucherTidyReq>({ // 表单数据
  accountSetId: 0,
  month: '',
  voucherWordId: undefined,
  startNumber: 1,
  type: FmsVoucherTidyType.FILL_GAPS,
})

/** 打开整理凭证弹窗 */
async function open() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const month = fmsStore.currentMonth || ''
  monthPicker.value = parseFmsMonth(month)
  formData.value = { // 凭证字由单选组在值为空时自动选中默认项
    accountSetId,
    month,
    voucherWordId: undefined,
    startNumber: 1,
    type: FmsVoucherTidyType.FILL_GAPS,
  }
  visible.value = true
}
defineExpose({ open })

/** 月份选择确认 */
function handleMonthConfirm() {
  formData.value.month = formatFmsMonth(monthPicker.value)
}

/** 提交凭证整理 */
async function handleSubmit() {
  if (!formData.value.month) {
    toast.warning('请选择整理范围')
    return
  }
  if (!formData.value.voucherWordId) {
    toast.warning('请选择凭证字')
    return
  }
  formLoading.value = true
  try {
    await tidyVoucher(formData.value)
    toast.success('整理成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
