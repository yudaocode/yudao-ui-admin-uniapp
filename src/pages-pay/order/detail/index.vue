<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="支付订单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="商户单号" :value="formData.merchantOrderId || '-'" />
      <wd-cell title="支付单号" :value="formData.no || '-'" />
      <wd-cell title="应用编号" :value="formData.appId != null ? String(formData.appId) : '-'" />
      <wd-cell title="应用名称" :value="formData.appName || '-'" />
      <wd-cell title="支付状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.PAY_ORDER_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="支付金额" :value="formatDisplayMoney(formData.price)" />
      <wd-cell title="手续费" :value="formatDisplayMoney(formData.channelFeePrice)" />
      <wd-cell title="手续费比例" :value="formData.channelFeeRate != null ? `${Number(formData.channelFeeRate).toFixed(2)}%` : '-'" />
      <wd-cell title="商品标题" :value="formData.subject || '-'" />
      <wd-cell title="商品描述" :value="formData.body || '-'" />
      <wd-cell title="支付渠道">
        <dict-tag v-if="formData.channelCode" :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="formData.channelCode" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="渠道单号" :value="formData.channelOrderNo || '-'" />
      <wd-cell title="渠道用户" :value="formData.channelUserId || '-'" />
      <wd-cell title="支付 IP" :value="formData.userIp || '-'" />
      <wd-cell title="退款金额" :value="formatDisplayMoney(formData.refundPrice)" />
      <wd-cell title="支付时间" :value="formatDateTime(formData.successTime) || '-'" />
      <wd-cell title="失效时间" :value="formatDateTime(formData.expireTime) || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      <wd-cell title="更新时间" :value="formatDateTime(formData.updateTime) || '-'" />
      <wd-cell title="通知地址">
        <text class="break-all text-right text-[#333]">{{ formData.notifyUrl || '-' }}</text>
      </wd-cell>
      <wd-cell title="回调内容">
        <text class="break-all text-right text-[#333]">{{ formData.extension?.channelNotifyData || '-' }}</text>
      </wd-cell>
    </wd-cell-group>
  </view>
</template>

<script lang="ts" setup>
import type { PayOrder } from '@/api/pay/order'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getPayOrderDetail } from '@/api/pay/order'
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
const formData = ref<PayOrder>({}) // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pay/order/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPayOrderDetail(props.id)
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
