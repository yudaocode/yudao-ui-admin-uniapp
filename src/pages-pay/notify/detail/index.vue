<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="支付通知详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="任务编号" :value="formData.id != null ? String(formData.id) : '-'" />
      <wd-cell title="支付应用" :value="formData.appName || '-'" />
      <wd-cell title="通知类型">
        <dict-tag v-if="formData.type != null" :type="DICT_TYPE.PAY_NOTIFY_TYPE" :value="formData.type" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="关联编号" :value="formData.dataId != null ? String(formData.dataId) : '-'" />
      <wd-cell title="通知状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.PAY_NOTIFY_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="商户订单" :value="formData.merchantOrderId || '-'" />
      <wd-cell title="商户退款" :value="formData.merchantRefundId || '-'" />
      <wd-cell title="商户转账" :value="formData.merchantTransferId || '-'" />
      <wd-cell title="通知次数" :value="formData.notifyTimes != null ? String(formData.notifyTimes) : '-'" />
      <wd-cell title="最大通知次数" :value="formData.maxNotifyTimes != null ? String(formData.maxNotifyTimes) : '-'" />
      <wd-cell title="最后通知时间" :value="formatDateTime(formData.lastExecuteTime) || '-'" />
      <wd-cell title="下次通知时间" :value="formatDateTime(formData.nextNotifyTime) || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      <wd-cell title="更新时间" :value="formatDateTime(formData.updateTime) || '-'" />
    </wd-cell-group>

    <!-- 回调日志 -->
    <view v-if="formData.logs?.length" class="mt-24rpx">
      <view class="px-24rpx pb-16rpx text-30rpx text-[#333] font-semibold">
        回调日志
      </view>
      <view
        v-for="log in formData.logs"
        :key="log.id"
        class="mx-24rpx mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">日志编号：{{ log.id }}</text>
          <dict-tag :type="DICT_TYPE.PAY_NOTIFY_STATUS" :value="log.status" />
        </view>
        <view class="mb-12rpx text-28rpx text-[#666]">
          通知次数：{{ log.notifyTimes ?? '-' }}
        </view>
        <view class="mb-12rpx text-28rpx text-[#666]">
          通知时间：{{ formatDateTime(log.createTime) || '-' }}
        </view>
        <view class="break-all text-28rpx text-[#666]">
          响应结果：{{ log.response || '-' }}
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PayNotifyTask } from '@/api/pay/notify'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getPayNotifyTaskDetail } from '@/api/pay/notify'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<PayNotifyTask>({}) // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pay/notify/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPayNotifyTaskDetail(props.id)
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
