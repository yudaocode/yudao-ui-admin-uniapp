<template>
  <!-- 移动凭证弹窗 -->
  <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        移动凭证
      </view>

      <view class="mb-24rpx flex items-center justify-between" @click="monthVisible = true">
        <text class="text-28rpx text-[#666]">期间</text>
        <view class="flex items-center gap-8rpx">
          <text class="text-28rpx text-[#333]">{{ formData.month || '请选择期间' }}</text>
          <wd-icon name="arrow-right" size="28rpx" color="#999" />
        </view>
      </view>
      <wd-datetime-picker
        v-model="monthPicker"
        v-model:visible="monthVisible"
        title="请选择期间"
        type="year-month"
        @confirm="handleMonthConfirm"
      />

      <view class="mb-24rpx">
        <view class="mb-16rpx text-28rpx text-[#666]">
          凭证字
        </view>
        <wd-radio-group v-model="formData.voucherWordId" type="button">
          <wd-radio v-for="item in voucherWords" :key="item.id" :value="item.id">
            {{ item.name }}
          </wd-radio>
        </wd-radio-group>
      </view>

      <view class="mb-32rpx">
        <view class="mb-16rpx text-28rpx text-[#666]">
          移动规则
        </view>
        <view class="flex items-center text-28rpx text-[#666]">
          <text>将</text>
          <wd-input-number v-model="formData.sourceNumber" allow-null :min="1" :precision="0" :update-on-init="false" />
          <text class="mx-8rpx">号移动到</text>
          <wd-input-number v-model="formData.targetNumber" allow-null :min="1" :precision="0" :update-on-init="false" />
          <text class="mx-8rpx">号之前</text>
        </view>
      </view>

      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        确 定
      </wd-button>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { VoucherMoveReq } from '@/api/fms/voucher'
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getVoucherWordSimpleList } from '@/api/fms/config/voucher-word'
import { moveVoucher } from '@/api/fms/voucher'
import { useFmsStore } from '@/pages-fms/store/fms'
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
const voucherWords = ref<VoucherWord[]>([]) // 凭证字列表
const formData = ref<VoucherMoveReq>({ // 表单数据
  accountSetId: 0,
  month: '',
  voucherWordId: 0,
  sourceNumber: 0,
  targetNumber: 0,
})

/** 打开移动凭证弹窗 */
async function open() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  voucherWords.value = await getVoucherWordSimpleList(accountSetId)
  const month = fmsStore.currentMonth || ''
  monthPicker.value = parseFmsMonth(month)
  formData.value = {
    accountSetId,
    month,
    voucherWordId: voucherWords.value.find(item => item.defaultStatus)?.id || voucherWords.value[0]?.id || 0,
    sourceNumber: 0,
    targetNumber: 0,
  }
  visible.value = true
}
defineExpose({ open })

/** 月份选择确认 */
function handleMonthConfirm() {
  formData.value.month = formatFmsMonth(monthPicker.value)
}

/** 提交凭证移动 */
async function handleSubmit() {
  if (!formData.value.month) {
    toast.warning('请选择期间')
    return
  }
  if (!formData.value.voucherWordId) {
    toast.warning('请选择凭证字')
    return
  }
  if (!formData.value.sourceNumber || !formData.value.targetNumber) {
    toast.warning('请输入完整的移动规则')
    return
  }
  if (formData.value.targetNumber >= formData.value.sourceNumber) {
    toast.warning('移动到的凭证号必须小于原凭证号')
    return
  }
  formLoading.value = true
  try {
    await moveVoucher(formData.value)
    toast.success('移动成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
