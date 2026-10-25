<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="佣金提现详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="用户编号" :value="formData.userId != null ? String(formData.userId) : '-'" />
      <wd-cell title="用户昵称" :value="formData.userNickname || '-'" />
      <wd-cell title="提现金额" :value="formatDisplayMoney(formData.price)" />
      <wd-cell title="手续费" :value="formatDisplayMoney(formData.feePrice)" />
      <wd-cell title="到账金额" :value="formatDisplayMoney(formData.totalPrice)" />
      <wd-cell title="提现类型">
        <dict-tag v-if="formData.type != null" :type="DICT_TYPE.BROKERAGE_WITHDRAW_TYPE" :value="formData.type" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="姓名" :value="formData.userName || '-'" />
      <wd-cell title="账号" :value="formData.userAccount || '-'" />
      <wd-cell title="银行">
        <dict-tag v-if="formData.bankName != null && formData.bankName !== ''" :type="DICT_TYPE.BROKERAGE_BANK_NAME" :value="formData.bankName" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="开户地址" :value="formData.bankAddress || '-'" />
      <wd-cell title="收款码">
        <wd-img
          v-if="formData.qrCodeUrl"
          :src="formData.qrCodeUrl"
          width="120rpx" height="120rpx" radius="8rpx" mode="aspectFill"
          enable-preview
        />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="提现状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.BROKERAGE_WITHDRAW_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="审核备注" :value="formData.auditReason || '-'" />
      <wd-cell title="审核时间" :value="formatDateTime(formData.auditTime) || '-'" />
      <wd-cell title="转账错误" :value="formData.transferErrorMsg || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="canAudit || canRetry" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="canAudit">
          <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleApprove">
            通过申请
          </wd-button>
          <wd-button class="flex-1" type="danger" @click="rejectVisible = true">
            驳回申请
          </wd-button>
        </template>
        <!-- 提现失败(21) 可重新转账：复用 /approve 重新发起 -->
        <wd-button v-if="canRetry" class="flex-1" type="warning" :loading="submitting" @click="handleApprove">
          重新转账
        </wd-button>
      </view>
    </view>

    <!-- 驳回弹窗 -->
    <wd-popup
      v-model="rejectVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="rejectVisible = false"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          驳回申请
        </view>
        <wd-textarea v-model="auditReason" clearable :maxlength="200" placeholder="请输入驳回原因" />
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="rejectVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="danger" :loading="submitting" @click="handleReject">
            确定驳回
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { TradeBrokerageWithdraw } from '@/api/mall/trade/brokerage/withdraw'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  approveTradeBrokerageWithdraw,
  getTradeBrokerageWithdraw,
  rejectTradeBrokerageWithdraw,
} from '@/api/mall/trade/brokerage/withdraw'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { BrokerageWithdrawStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<TradeBrokerageWithdraw>({}) // 详情数据
const submitting = ref(false) // 操作提交状态
const rejectVisible = ref(false) // 驳回弹窗
const auditReason = ref('') // 驳回原因
const canAudit = computed(() => formData.value.status === BrokerageWithdrawStatusEnum.AUDITING && hasAccessByCodes(['trade:brokerage-withdraw:audit'])) // 仅审核中可审核（通过/驳回）
const canRetry = computed(() => formData.value.status === BrokerageWithdrawStatusEnum.WITHDRAW_FAIL && hasAccessByCodes(['trade:brokerage-withdraw:audit'])) // 提现失败可重新转账

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/brokerage/withdraw/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getTradeBrokerageWithdraw(props.id)
  } finally {
    toast.close()
  }
}

/** 通过申请 / 重新转账（均调用 /approve） */
async function handleApprove() {
  const isRetry = formData.value.status === BrokerageWithdrawStatusEnum.WITHDRAW_FAIL
  try {
    await dialog.confirm({ title: '提示', msg: isRetry ? '确定要重新转账吗？' : '确定通过该提现申请吗？' })
  } catch {
    return
  }
  submitting.value = true
  try {
    await approveTradeBrokerageWithdraw(props.id)
    toast.success(isRetry ? '已重新发起转账' : '审核通过')
    uni.$emit('mall:brokerage-withdraw:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 驳回申请 */
async function handleReject() {
  if (!auditReason.value.trim()) {
    toast.warning('请输入驳回原因')
    return
  }
  submitting.value = true
  try {
    await rejectTradeBrokerageWithdraw({ id: props.id, auditReason: auditReason.value })
    toast.success('驳回成功')
    rejectVisible.value = false
    uni.$emit('mall:brokerage-withdraw:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
