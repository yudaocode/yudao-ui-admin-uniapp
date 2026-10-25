<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="钱包余额详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="钱包编号" :value="formData.id != null ? String(formData.id) : '-'" />
      <wd-cell title="用户编号" :value="formData.userId != null ? String(formData.userId) : '-'" />
      <wd-cell title="用户类型">
        <dict-tag v-if="formData.userType != null" :type="DICT_TYPE.USER_TYPE" :value="formData.userType" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="余额" :value="formatDisplayMoney(formData.balance)" />
      <wd-cell title="累计充值" :value="formatDisplayMoney(formData.totalRecharge)" />
      <wd-cell title="累计支出" :value="formatDisplayMoney(formData.totalExpense)" />
      <wd-cell title="冻结金额" :value="formatDisplayMoney(formData.freezePrice)" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="handleTransaction">
          查看流水
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PayWallet } from '@/api/pay/wallet/balance'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getPayWallet } from '@/api/pay/wallet/balance'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatDisplayMoney } from '@/utils/format'

const props = defineProps<{
  id?: number | any
  userId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<PayWallet>({}) // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pay/wallet/balance/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.userId) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPayWallet({ userId: props.userId })
  } finally {
    toast.close()
  }
}

/** 查看钱包流水 */
function handleTransaction() {
  const walletId = formData.value.id ?? props.id
  if (!walletId) {
    return
  }
  uni.navigateTo({ url: `/pages-pay/wallet/transaction/index?walletId=${walletId}` })
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
