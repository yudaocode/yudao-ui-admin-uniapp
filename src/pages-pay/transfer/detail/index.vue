<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="转账单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="转账单号" :value="formData.no || '-'" />
      <wd-cell title="商户单号" :value="formData.merchantTransferId || '-'" />
      <wd-cell title="支付应用" :value="formData.appName || '-'" />
      <wd-cell title="转账状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.PAY_TRANSFER_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="转账金额" :value="formatDisplayMoney(formData.price)" />
      <wd-cell title="转账标题" :value="formData.subject || '-'" />
      <wd-cell title="转账渠道">
        <dict-tag v-if="formData.channelCode" :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="formData.channelCode" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="收款人姓名" :value="formData.userName || '-'" />
      <wd-cell title="收款人账号">
        <text class="break-all text-right text-[#333]">{{ formData.userAccount || '-' }}</text>
      </wd-cell>
      <wd-cell title="渠道单号" :value="formData.channelTransferNo || '-'" />
      <wd-cell title="渠道错误码" :value="formData.channelErrorCode || '-'" />
      <wd-cell title="渠道错误信息" :value="formData.channelErrorMsg || '-'" />
      <wd-cell title="成功时间" :value="formatDateTime(formData.successTime) || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      <wd-cell title="转账 IP" :value="formData.userIp || '-'" />
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
import type { PayTransfer } from '@/api/pay/transfer'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getPayTransfer } from '@/api/pay/transfer'
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
const formData = ref<PayTransfer>({}) // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pay/transfer/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPayTransfer(props.id)
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
