<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="退款订单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="退款单号" :value="formData.no || '-'" />
      <wd-cell title="商户退款单号" :value="formData.merchantRefundId || '-'" />
      <wd-cell title="商户支付单号" :value="formData.merchantOrderId || '-'" />
      <wd-cell title="支付应用" :value="formData.appName || '-'" />
      <wd-cell title="退款状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.PAY_REFUND_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="支付金额" :value="formatDisplayMoney(formData.payPrice)" />
      <wd-cell title="退款金额" :value="formatDisplayMoney(formData.refundPrice)" />
      <wd-cell title="退款渠道">
        <dict-tag v-if="formData.channelCode" :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="formData.channelCode" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="退款原因" :value="formData.reason || '-'" />
      <wd-cell title="退款 IP" :value="formData.userIp || '-'" />
      <wd-cell title="渠道支付单号" :value="formData.channelOrderNo || '-'" />
      <wd-cell title="渠道退款单号" :value="formData.channelRefundNo || '-'" />
      <wd-cell title="渠道错误码" :value="formData.channelErrorCode || '-'" />
      <wd-cell title="渠道错误信息" :value="formData.channelErrorMsg || '-'" />
      <wd-cell title="成功时间" :value="formatDateTime(formData.successTime) || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      <wd-cell title="通知地址">
        <text class="break-all text-right text-[#333]">{{ formData.notifyUrl || '-' }}</text>
      </wd-cell>
      <wd-cell title="回调内容">
        <text class="break-all text-right text-[#333]">{{ formData.channelNotifyData || '-' }}</text>
      </wd-cell>
    </wd-cell-group>
  </view>
</template>

<script lang="ts" setup>
import type { PayRefund } from '@/api/pay/refund'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getPayRefund } from '@/api/pay/refund'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatDisplayMoney } from '@/utils/format'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<PayRefund>({}) // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pay/refund/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPayRefund(props.id)
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
