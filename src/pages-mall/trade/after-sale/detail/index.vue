<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="售后详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view v-if="formData" class="p-24rpx">
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ formData.no || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                申请时间：{{ formatDateTime(formData.createTime) || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_STATUS" :value="formData.status" />
          </view>
          <view class="grid grid-cols-2 gap-x-20rpx gap-y-12rpx text-26rpx">
            <view><text class="text-[#999]">订单号：</text>{{ formData.orderNo || '-' }}</view>
            <view><text class="text-[#999]">售后方式：</text>{{ getDictLabel(DICT_TYPE.TRADE_AFTER_SALE_WAY, formData.way) || '-' }}</view>
            <view><text class="text-[#999]">售后类型：</text>{{ getDictLabel(DICT_TYPE.TRADE_AFTER_SALE_TYPE, formData.type) || '-' }}</view>
            <view><text class="text-[#999]">退款金额：</text>{{ formatDisplayMoney(formData.refundPrice) }}</view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            售后商品
          </view>
          <view class="flex gap-20rpx rounded-8rpx bg-[#f8f8f8] p-16rpx">
            <wd-img
              v-if="formData.picUrl"
              :src="formData.picUrl"
              width="128rpx" height="128rpx" radius="8rpx" mode="aspectFill"
              enable-preview
            />
            <view class="min-w-0 flex-1">
              <view class="line-clamp-2 text-28rpx text-[#333] font-semibold">
                {{ formData.spuName || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#777]">
                数量：{{ formData.count || 0 }}
              </view>
              <view v-if="formData.properties?.length" class="mt-8rpx text-22rpx text-[#999]">
                {{ formData.properties.map(prop => `${prop.propertyName}:${prop.valueName}`).join('；') }}
              </view>
            </view>
          </view>
        </view>

        <!-- 订单信息 -->
        <view v-if="formData.order" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            订单信息
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view class="flex items-center">
              <text class="text-[#999]">配送方式：</text>
              <dict-tag :type="DICT_TYPE.TRADE_DELIVERY_TYPE" :value="formData.order.deliveryType" />
            </view>
            <view><text class="text-[#999]">收货人：</text>{{ formData.order.receiverName || '-' }}</view>
            <view><text class="text-[#999]">手机号：</text>{{ formData.order.receiverMobile || '-' }}</view>
            <view><text class="text-[#999]">买家留言：</text>{{ formData.order.userRemark || '-' }}</view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            申请信息
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view><text class="text-[#999]">申请原因：</text>{{ formData.applyReason || '-' }}</view>
            <view><text class="text-[#999]">补充描述：</text>{{ formData.applyDescription || '-' }}</view>
            <view v-if="formData.applyPicUrls?.length">
              <text class="text-[#999]">申请图片：</text>
              <view class="mt-12rpx flex flex-wrap gap-12rpx">
                <wd-img
                  v-for="url in formData.applyPicUrls"
                  :key="url"
                  :src="url"
                  width="120rpx" height="120rpx" radius="8rpx" mode="aspectFill"
                  enable-preview
                />
              </view>
            </view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            处理信息
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view><text class="text-[#999]">审核备注：</text>{{ formData.auditReason || '-' }}</view>
            <view><text class="text-[#999]">审核时间：</text>{{ formatDateTime(formData.auditTime) || '-' }}</view>
            <view><text class="text-[#999]">退货物流：</text>{{ formData.logisticsNo || '-' }}</view>
            <view><text class="text-[#999]">收货时间：</text>{{ formatDateTime(formData.receiveTime) || '-' }}</view>
            <view><text class="text-[#999]">退款时间：</text>{{ formatDateTime(formData.refundTime) || '-' }}</view>
          </view>
        </view>

        <!-- 售后日志 -->
        <view v-if="formData.logs?.length" class="mb-160rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            售后日志
          </view>
          <view class="relative pl-8rpx">
            <view
              v-for="(log, index) in formData.logs"
              :key="log.id ?? index"
              class="relative flex gap-20rpx pb-28rpx before:absolute before:bottom-0 before:left-23rpx before:top-48rpx before:w-2rpx before:bg-[#ebebeb] last:pb-0 before:content-[''] last:before:hidden"
            >
              <view
                class="z-1 h-48rpx w-48rpx flex shrink-0 items-center justify-center rounded-full text-24rpx text-white"
                :style="{ backgroundColor: getUserTypeColor(log.userType) }"
              >
                {{ getUserTypeText(log.userType) }}
              </view>
              <view class="min-w-0 flex-1 pt-4rpx">
                <view class="text-26rpx text-[#333]">
                  {{ log.content || '-' }}
                </view>
                <view class="mt-6rpx text-22rpx text-[#999]">
                  {{ formatDateTime(log.createTime) || '-' }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <wd-empty v-else icon="content" tip="售后单不存在" />
    </scroll-view>

    <!-- 底部操作按钮：按售后状态 + 权限显式展示，每个动作各自的按钮 + 处理函数 -->
    <view v-if="formData && (canDisagree || canAgree || canReceive || canRefund)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canDisagree" class="flex-1" type="danger" @click="openReject('disagree')">
          拒绝售后
        </wd-button>
        <wd-button v-if="canAgree" class="flex-1" type="primary" :loading="submitting" @click="handleAgree">
          同意售后
        </wd-button>
        <wd-button v-if="canReceive" class="flex-1" type="danger" @click="openReject('refuse')">
          拒绝收货
        </wd-button>
        <wd-button v-if="canReceive" class="flex-1" type="primary" :loading="submitting" @click="handleReceive">
          确认收货
        </wd-button>
        <wd-button v-if="canRefund" class="flex-1" type="primary" :loading="submitting" @click="handleRefund">
          确认退款
        </wd-button>
      </view>
    </view>

    <!-- 拒绝原因（拒绝售后 / 拒绝收货 共用） -->
    <wd-popup
      v-model="rejectVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="rejectReason = ''"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          {{ rejectAction === 'refuse' ? '拒绝收货' : '拒绝售后' }}
        </view>
        <wd-textarea v-model="rejectReason" clearable :maxlength="500" :placeholder="rejectAction === 'refuse' ? '请输入拒绝收货原因' : '请输入拒绝原因'" />
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="rejectVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleReject">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { TradeAfterSale } from '@/api/mall/trade/after-sale'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  agreeTradeAfterSale,
  disagreeTradeAfterSale,
  getTradeAfterSale,
  receiveTradeAfterSale,
  refundTradeAfterSale,
  refuseTradeAfterSale,
} from '@/api/mall/trade/after-sale'
import { getDictLabel, getDictObj } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, TradeAfterSaleStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const detailId = computed(() => props.id != null && props.id !== '' ? Number(props.id) : undefined) // 售后编号（路由透传）
const formData = ref<TradeAfterSale>() // 售后详情
const rejectVisible = ref(false) // 拒绝弹窗
const rejectReason = ref('') // 拒绝原因
const rejectAction = ref<'disagree' | 'refuse'>('disagree') // 拒绝弹窗对应动作：拒绝售后 / 拒绝收货
const submitting = ref(false) // 提交状态

// 各动作可见性：申请中可同意/拒绝售后，待买家退货可确认/拒绝收货，待退款可退款（同意/拒绝为后端独立权限码）
const canAgree = computed(() => formData.value?.status === TradeAfterSaleStatusEnum.APPLY && hasAccessByCodes(['trade:after-sale:agree']))
const canDisagree = computed(() => formData.value?.status === TradeAfterSaleStatusEnum.APPLY && hasAccessByCodes(['trade:after-sale:disagree']))
const canReceive = computed(() => formData.value?.status === TradeAfterSaleStatusEnum.WAIT_RETURN && hasAccessByCodes(['trade:after-sale:receive']))
const canRefund = computed(() => formData.value?.status === TradeAfterSaleStatusEnum.WAIT_REFUND && hasAccessByCodes(['trade:after-sale:refund']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/after-sale/index')
}

/** 售后日志：按用户类型取节点颜色 */
function getUserTypeColor(userType?: number) {
  const dict = getDictObj(DICT_TYPE.USER_TYPE, userType ?? 0)
  switch (dict?.colorType) {
    case 'success':
      return '#67C23A'
    case 'info':
      return '#909399'
    case 'warning':
      return '#E6A23C'
    case 'danger':
      return '#F56C6C'
  }
  return '#409EFF'
}

/** 售后日志：节点文案（用户类型首字，缺省为「系」） */
function getUserTypeText(userType?: number) {
  return getDictLabel(DICT_TYPE.USER_TYPE, userType ?? 0)?.[0] || '系'
}

/** 加载详情 */
async function loadDetail() {
  if (!detailId.value) {
    return
  }
  formData.value = await getTradeAfterSale(detailId.value)
}

/** 提交后统一处理：成功提示 + 通知列表刷新 + 重载详情 */
async function afterSubmit() {
  toast.success('操作成功')
  uni.$emit('mall:trade-after-sale:reload')
  await loadDetail()
}

/** 同意售后 */
async function handleAgree() {
  if (!detailId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定同意该售后申请吗？' })
  } catch {
    return
  }
  submitting.value = true
  try {
    await agreeTradeAfterSale(detailId.value)
    await afterSubmit()
  } finally {
    submitting.value = false
  }
}

/** 确认收货 */
async function handleReceive() {
  if (!detailId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定已收到退货商品吗？' })
  } catch {
    return
  }
  submitting.value = true
  try {
    await receiveTradeAfterSale(detailId.value)
    await afterSubmit()
  } finally {
    submitting.value = false
  }
}

/** 确认退款 */
async function handleRefund() {
  if (!detailId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定执行退款吗？' })
  } catch {
    return
  }
  submitting.value = true
  try {
    await refundTradeAfterSale(detailId.value)
    await afterSubmit()
  } finally {
    submitting.value = false
  }
}

/** 打开拒绝弹窗（拒绝售后 / 拒绝收货） */
function openReject(action: 'disagree' | 'refuse') {
  rejectAction.value = action
  rejectReason.value = ''
  rejectVisible.value = true
}

/** 拒绝售后 / 拒绝收货 */
async function handleReject() {
  if (!detailId.value) {
    return
  }
  if (!rejectReason.value.trim()) {
    toast.warning(rejectAction.value === 'refuse' ? '请输入拒绝收货原因' : '请输入拒绝原因')
    return
  }
  submitting.value = true
  try {
    if (rejectAction.value === 'refuse') {
      await refuseTradeAfterSale(detailId.value, rejectReason.value)
    } else {
      await disagreeTradeAfterSale({ id: detailId.value, auditReason: rejectReason.value })
    }
    rejectVisible.value = false
    await afterSubmit()
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadDetail()
})
</script>
