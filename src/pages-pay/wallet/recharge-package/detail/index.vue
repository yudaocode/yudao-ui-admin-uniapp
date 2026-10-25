<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="充值套餐详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="套餐编号" :value="formData.id != null ? String(formData.id) : '-'" />
      <wd-cell title="套餐名" :value="formData.name || '-'" />
      <wd-cell title="支付金额" :value="formatDisplayMoney(formData.payPrice)" />
      <wd-cell title="赠送金额" :value="formatDisplayMoney(formData.bonusPrice)" />
      <wd-cell title="状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['pay:wallet-recharge-package:update']) || hasAccessByCodes(['pay:wallet-recharge-package:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['pay:wallet-recharge-package:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['pay:wallet-recharge-package:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PayWalletRechargePackage } from '@/api/pay/wallet/rechargePackage'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deletePayWalletRechargePackage, getPayWalletRechargePackage } from '@/api/pay/wallet/rechargePackage'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
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

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<PayWalletRechargePackage>({}) // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pay/wallet/recharge-package/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPayWalletRechargePackage(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-pay/wallet/recharge-package/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该充值套餐吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePayWalletRechargePackage(props.id)
    toast.success('删除成功')
    uni.$emit('pay:recharge-package:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('pay:recharge-package:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('pay:recharge-package:reload', getDetail)
})
</script>
