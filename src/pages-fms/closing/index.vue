<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="期末结账"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="hasAccessByCodes(['fms:closing:query'])">
      <template v-if="fmsStore.accountSet">
        <!-- 账套切换 -->
        <view class="p-24rpx pb-0">
          <AccountSetSwitch @change="reload" />
        </view>

        <!-- 当前会计期间 -->
        <!-- TODO @AI：貌似和顶部的间隙，没生效？？？ -->
        <view class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="flex items-center justify-between">
            <view class="text-34rpx text-[#333] font-semibold">
              {{ monthLabel }}
            </view>
            <wd-tag v-if="overview" :type="overview.closed ? 'success' : 'info'" plain>
              {{ overview.closed ? '已结账' : '未结账' }}
            </wd-tag>
          </view>
          <view v-if="overview" class="mt-12rpx text-26rpx text-[#999]">
            本期共录入凭证 {{ overview.voucherCount || 0 }} 张
          </view>
        </view>

        <!-- 结账概况加载失败 -->
        <view
          v-if="overviewLoadFailed"
          class="mx-24rpx mb-24rpx rounded-12rpx bg-white py-48rpx text-center text-26rpx text-[#999] shadow-sm"
        >
          <view>结账概况加载失败</view>
          <wd-button class="mt-16rpx" size="small" type="primary" plain @click="reload">
            重新加载
          </wd-button>
        </view>

        <!-- 结账检查 -->
        <view v-else-if="overview" class="mx-24rpx mb-24rpx rounded-12rpx bg-white shadow-sm">
          <view class="border-0 border-b border-[#f0f0f0] border-solid px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
            结账检查
          </view>
          <!-- 凭证审核 -->
          <view class="flex items-center justify-between border-0 border-b border-[#f0f0f0] border-solid px-24rpx py-20rpx">
            <view class="min-w-0 flex-1">
              <view class="text-28rpx text-[#333]">
                凭证审核
              </view>
              <view class="mt-6rpx text-24rpx text-[#999]">
                {{ overview.pendingVoucherCount }} 张待审核
              </view>
            </view>
            <wd-tag
              :type="!overview.voucherReviewRequired || overview.pendingVoucherCount === 0 ? 'success' : 'danger'"
              plain
            >
              {{ overview.voucherReviewRequired ? '结账前必须审核' : '当前未强制审核' }}
            </wd-tag>
          </view>
          <!-- 初始余额 -->
          <view class="flex items-center justify-between border-0 border-b border-[#f0f0f0] border-solid px-24rpx py-20rpx">
            <view class="min-w-0 flex-1">
              <view class="text-28rpx text-[#333]">
                初始余额
              </view>
              <view class="mt-6rpx text-24rpx text-[#999]">
                {{ overview.initialBalanceBalanced ? '试算平衡' : '试算不平衡' }}
              </view>
            </view>
            <wd-tag :type="overview.initialBalanceBalanced ? 'success' : 'danger'" plain>
              {{ overview.initialBalanceBalanced ? '检查通过' : '需要处理' }}
            </wd-tag>
          </view>
          <!-- 凭证编号 -->
          <view class="flex items-center justify-between border-0 border-b border-[#f0f0f0] border-solid px-24rpx py-20rpx">
            <view class="min-w-0 flex-1">
              <view class="text-28rpx text-[#333]">
                凭证编号
              </view>
              <view class="mt-6rpx text-24rpx text-[#999]">
                {{ overview.voucherNumberContinuous ? '编号连续' : '存在断号' }}
              </view>
            </view>
            <wd-tag :type="overview.voucherNumberContinuous ? 'success' : 'danger'" plain>
              {{ overview.voucherNumberContinuous ? '检查通过' : '需要整理' }}
            </wd-tag>
          </view>
          <!-- 损益结转 -->
          <view class="flex items-center justify-between border-0 border-b border-[#f0f0f0] border-solid px-24rpx py-20rpx">
            <view class="min-w-0 flex-1">
              <view class="text-28rpx text-[#333]">
                损益结转
              </view>
              <view class="mt-6rpx text-24rpx text-[#999]">
                {{ formatFmsAmount(overview.profitLossBalance) }}
              </view>
            </view>
            <wd-tag
              :type="overview.profitLossVoucherGenerated && overview.profitLossBalance === 0 ? 'success' : 'warning'"
              plain
            >
              {{ !overview.profitLossVoucherGenerated ? '未生成结转凭证' : overview.profitLossBalance === 0 ? '已结平' : '待结转' }}
            </wd-tag>
          </view>
          <!-- 利润表检查 -->
          <view class="flex items-center justify-between border-0 border-b border-[#f0f0f0] border-solid px-24rpx py-20rpx">
            <view class="min-w-0 flex-1">
              <view class="text-28rpx text-[#333]">
                利润表检查
              </view>
              <view class="mt-6rpx text-24rpx text-[#999]">
                {{ overview.incomeStatementUnmappedSubjectCount
                  ? `${overview.incomeStatementUnmappedSubjectCount} 个科目未纳入公式`
                  : overview.incomeStatementBalanced ? '勾稽平衡' : '勾稽不平衡' }}
              </view>
            </view>
            <wd-tag
              :type="overview.incomeStatementBalanced && overview.incomeStatementUnmappedSubjectCount === 0 ? 'success' : 'danger'"
              plain
            >
              {{ overview.incomeStatementBalanced && overview.incomeStatementUnmappedSubjectCount === 0 ? '检查通过' : '需要处理' }}
            </wd-tag>
          </view>
          <!-- 资产负债平衡 -->
          <view class="flex items-center justify-between px-24rpx py-20rpx">
            <view class="min-w-0 flex-1">
              <view class="text-28rpx text-[#333]">
                资产负债平衡
              </view>
              <view class="mt-6rpx text-24rpx text-[#999]">
                差额 {{ formatFmsAmount(overview.balanceSheetDifference) }}
              </view>
            </view>
            <wd-tag
              :type="overview.balanceSheetProfitLossTransferred
                && overview.balanceSheetBalanced
                && overview.balanceSheetUnmappedSubjectCount === 0 ? 'success' : 'danger'"
              plain
            >
              {{ balanceSheetCheckLabel }}
            </wd-tag>
          </view>
        </view>

        <!-- 结账方案入口 -->
        <view
          class="mx-24rpx mb-24rpx flex items-center justify-between rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleSchemeList"
        >
          <view>
            <view class="text-30rpx text-[#333] font-semibold">
              结账方案
            </view>
            <view class="mt-6rpx text-24rpx text-[#999]">
              查看期末结转方案与分录规则
            </view>
          </view>
          <wd-icon name="arrow-right" size="32rpx" color="#999" />
        </view>
      </template>

      <!-- 无可用账套引导 -->
      <AccountSetGuide />

      <!-- 底部操作按钮 -->
      <view v-if="canClosePeriod || canCancelClose" class="yd-detail-footer">
        <view class="yd-detail-footer-actions">
          <wd-button
            v-if="canClosePeriod"
            class="flex-1"
            type="primary"
            :loading="submitting"
            :disabled="!canClose"
            @click="handleClose"
          >
            结账
          </wd-button>
          <wd-button
            v-if="canCancelClose"
            class="flex-1"
            type="danger"
            :loading="submitting"
            @click="handleCancelClose"
          >
            反结账
          </wd-button>
        </view>
        <view
          v-if="canClosePeriod && !canClose"
          class="pt-12rpx text-center text-24rpx text-[#ed7b2f]"
        >
          完成上方结账检查后才可结账
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { ClosingOverview } from '@/api/fms/closing/period'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { cancelClosePeriod, closePeriod, getClosingOverview } from '@/api/fms/closing/period'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { formatFmsAmount, formatFmsPeriodLabel, formatFmsStartTime } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const fmsStore = useFmsStore()
const overview = ref<ClosingOverview>() // 结账概况
const prevOverview = ref<ClosingOverview>() // 上一月结账概况，用于判断是否可反结账
const overviewLoadFailed = ref(false) // 结账概况是否加载失败，失败时展示错误提示与重试
const submitting = ref(false) // 结账操作的提交中

const monthLabel = computed(() => // 当前会计期间文本
  fmsStore.currentMonth ? formatFmsPeriodLabel(fmsStore.currentMonth, fmsStore.currentMonth) : '',
)
const startMonth = computed(() => { // 账套启用月份，反结账目标期间的最早月份
  const accountSet = fmsStore.accountSetList.find(item => item.id === fmsStore.accountSet?.id)
  return formatFmsStartTime(accountSet?.startTime)
})
const prevMonth = computed(() => { // 当前期间的上一月，早于账套启用月时为空（反结账目标期间）
  if (!fmsStore.currentMonth || !startMonth.value) {
    return ''
  }
  const prev = dayjs(`${fmsStore.currentMonth}-01`).subtract(1, 'month').format('YYYY-MM')
  return prev >= startMonth.value ? prev : ''
})
const prevMonthLabel = computed(() => // 上一月会计期间文本
  prevMonth.value ? formatFmsPeriodLabel(prevMonth.value, prevMonth.value) : '',
)
const canClose = computed(() => overview.value?.canClose === true) // 后端全部结账条件是否满足
const canClosePeriod = computed(() => // 未结账且账套可写、有结账权限时可结账
  fmsStore.isAccountSetWritable
  && !!overview.value
  && !overview.value.closed
  && hasAccessByCodes(['fms:closing:close']),
)
const canCancelClose = computed(() => // 上一月已结账且账套可写、有反结账权限时可反结账（当前期间恒为未结账月，反结账针对上一月）
  fmsStore.isAccountSetWritable
  && !!prevOverview.value?.closed
  && hasAccessByCodes(['fms:closing:cancel']),
)
const balanceSheetCheckLabel = computed(() => { // 资产负债表检查结果文本
  if (!overview.value) {
    return ''
  }
  if (!overview.value.balanceSheetProfitLossTransferred) {
    return '损益未结转'
  }
  if (overview.value.balanceSheetUnmappedSubjectCount > 0) {
    return `${overview.value.balanceSheetUnmappedSubjectCount} 个科目未纳入公式`
  }
  return overview.value.balanceSheetBalanced ? '检查通过' : '不平衡'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获得结账概况 */
async function getOverview() {
  const accountSetId = fmsStore.accountSet?.id
  const month = fmsStore.currentMonth
  if (!accountSetId || !month) {
    overview.value = undefined
    prevOverview.value = undefined
    return
  }
  overviewLoadFailed.value = false
  try {
    overview.value = await getClosingOverview({ accountSetId, month })
  } catch {
    overview.value = undefined
    prevOverview.value = undefined
    overviewLoadFailed.value = true // 概况接口失败时保留错误提示与重试入口，不静默隐藏检查区
    return
  }
  // 加载上一月概况判断是否可反结账；上一月概况失败时不展示反结账入口
  prevOverview.value = prevMonth.value
    ? await getClosingOverview({ accountSetId, month: prevMonth.value }).catch(() => undefined)
    : undefined
}

/** 重新加载会计期间和结账概况 */
async function reload() {
  await fmsStore.loadCurrentMonth()
  await getOverview()
}

/** 结账 */
async function handleClose() {
  const accountSetId = fmsStore.accountSet?.id
  const month = fmsStore.currentMonth
  if (!accountSetId || !month || !canClose.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `结账后将锁定 ${monthLabel.value}，是否继续？`,
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await closePeriod({ accountSetId, month })
    toast.success('结账成功')
    await reload()
  } finally {
    submitting.value = false
  }
}

/** 反结账（针对当前期间的上一月） */
async function handleCancelClose() {
  const accountSetId = fmsStore.accountSet?.id
  const month = prevMonth.value
  if (!accountSetId || !month || !prevOverview.value?.closed) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `反结账会影响历史报表数据，将撤销 ${prevMonthLabel.value} 及之后的结账，确认继续吗？`,
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await cancelClosePeriod({ accountSetId, month })
    toast.success('反结账成功')
    await reload()
  } finally {
    submitting.value = false
  }
}

/** 查看结账方案列表 */
function handleSchemeList() {
  uni.navigateTo({ url: '/pages-fms/closing/scheme/index' })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await reload()
})
</script>
