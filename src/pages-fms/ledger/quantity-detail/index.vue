<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="数量金额明细账"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="hasAccessByCodes(['fms:ledger:detail:query'])">
      <template v-if="fmsStore.accountSet">
        <!-- 账套切换 -->
        <view class="p-24rpx pb-0">
          <AccountSetSwitch @change="handleAccountSetChange" />
        </view>

        <!-- 搜索组件 -->
        <!-- TODO @AI：间隙；看看别的模块，有没类似的情况 -->
        <SearchForm
          v-if="searchReady"
          show-subject
          :subject-options="subjectOptions"
          :initial-subject-id="initials.subjectId"
          :initial-start-month="initials.startMonth"
          :initial-end-month="initials.endMonth"
          search-placeholder="搜索数量金额明细账"
          @search="handleQuery"
          @reset="handleQuery"
        />

        <!-- 数量金额明细账列表 -->
        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view class="p-24rpx">
            <!-- 加载状态 -->
            <view
              v-if="loading || !searchReady"
              class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm"
            >
              <wd-loading size="32rpx" />
              <view class="mt-12rpx">
                正在加载账簿数据
              </view>
            </view>

            <view v-else-if="list.length" class="overflow-hidden rounded-12rpx bg-white shadow-sm">
              <!-- 科目标题 -->
              <view class="border-0 border-b border-[#eee] border-b-solid px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
                {{ list[0].subjectCode }} {{ list[0].subjectName }}
                <text v-if="list[0].quantityUnit" class="text-24rpx text-[#999] font-normal">
                  （单位：{{ list[0].quantityUnit }}）
                </text>
              </view>
              <view v-for="(row, index) in list" :key="index">
                <!-- 凭证分录行 -->
                <view v-if="row.rowType === FmsLedgerRowType.VOUCHER" class="border-0 border-b border-[#f5f5f5] border-b-solid px-24rpx py-20rpx">
                  <view class="mb-8rpx flex items-center justify-between gap-16rpx">
                    <text class="text-26rpx text-[#999]">{{ row.accountDate || '-' }}</text>
                    <text
                      v-if="row.voucherId && hasAccessByCodes(['fms:voucher:query'])"
                      class="text-26rpx text-[#1677ff]"
                      @click="openVoucher(row)"
                    >
                      {{ row.voucherNumber }}
                    </text>
                    <text v-else class="text-26rpx text-[#999]">{{ row.voucherNumber || '' }}</text>
                  </view>
                  <view class="mb-8rpx text-28rpx text-[#333]">
                    {{ row.digest || '-' }}
                  </view>
                  <view class="flex items-center justify-between gap-12rpx py-4rpx text-26rpx text-[#666]">
                    <text class="w-96rpx flex-shrink-0 text-[#999]">借方</text>
                    <text>数量 {{ formatFmsQuantity(row.debitQuantity) }}</text>
                    <text>单价 {{ formatFmsMoney(getDebitUnitPrice(row)) }}</text>
                    <text>金额 {{ formatFmsMoney(row.debitAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between gap-12rpx py-4rpx text-26rpx text-[#666]">
                    <text class="w-96rpx flex-shrink-0 text-[#999]">贷方</text>
                    <text>数量 {{ formatFmsQuantity(row.creditQuantity) }}</text>
                    <text>单价 {{ formatFmsMoney(getCreditUnitPrice(row)) }}</text>
                    <text>金额 {{ formatFmsMoney(row.creditAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between gap-12rpx py-4rpx text-26rpx text-[#666]">
                    <text class="w-96rpx flex-shrink-0 text-[#999]">结存</text>
                    <text>{{ row.balanceDirection || '-' }} {{ formatFmsQuantity(row.balanceQuantity) }}</text>
                    <text>单价 {{ formatFmsMoney(getBalanceUnitPrice(row)) }}</text>
                    <text>金额 {{ formatFmsMoney(row.balance) }}</text>
                  </view>
                </view>
                <!-- 汇总行（期初、本期合计、本年累计） -->
                <view
                  v-else
                  class="border-0 border-b border-[#f5f5f5] border-b-solid bg-[#fafafa] px-24rpx py-16rpx text-26rpx text-[#333] font-semibold"
                >
                  <view class="mb-4rpx flex flex-wrap items-center gap-x-24rpx gap-y-4rpx">
                    <text class="min-w-140rpx">{{ row.digest }}</text>
                    <text>借 {{ formatFmsMoney(row.debitAmount) }}</text>
                    <text>贷 {{ formatFmsMoney(row.creditAmount) }}</text>
                    <text>余 {{ formatFmsSubjectBalance(row.balance, row.balanceDirection) }}</text>
                  </view>
                  <view class="flex flex-wrap items-center gap-x-24rpx gap-y-4rpx text-24rpx text-[#666] font-normal">
                    <text>数量：借 {{ formatFmsQuantity(row.debitQuantity) }}</text>
                    <text>贷 {{ formatFmsQuantity(row.creditQuantity) }}</text>
                    <text>结存 {{ formatFmsQuantity(row.balanceQuantity) }}</text>
                  </view>
                  <view class="flex flex-wrap items-center gap-x-24rpx gap-y-4rpx text-24rpx text-[#666] font-normal">
                    <text>单价：借 {{ formatFmsMoney(getDebitUnitPrice(row)) }}</text>
                    <text>贷 {{ formatFmsMoney(getCreditUnitPrice(row)) }}</text>
                    <text>结存 {{ formatFmsMoney(getBalanceUnitPrice(row)) }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 空状态 -->
            <view v-else class="rounded-12rpx bg-white py-96rpx shadow-sm">
              <wd-empty icon="content" :tip="subjectOptions.length ? '暂无数量金额明细账数据' : '暂无启用数量核算的科目'" />
            </view>
          </view>
          <view class="h-40rpx" />
        </scroll-view>
      </template>

      <!-- 无可用账套引导 -->
      <AccountSetGuide />
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { Subject } from '@/api/fms/config/subject'
import type { LedgerQuantityDetail } from '@/api/fms/ledger'
import { getSubjectList } from '@/api/fms/config/subject'
import { FmsLedgerRowType, getLedgerQuantityDetailList } from '@/api/fms/ledger'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import SearchForm from '@/pages-fms/ledger/components/search-form.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { buildFmsSubjectOptions, formatFmsMoney, formatFmsQuantity, formatFmsSubjectBalance } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const loading = ref(false) // 账簿加载状态
const subjects = ref<Subject[]>([]) // 科目列表（用于筛选数量核算候选科目）
const list = ref<LedgerQuantityDetail[]>([]) // 数量金额明细账行列表
const searchReady = ref(false) // 搜索组件是否就绪，候选科目加载完成后渲染
const initials = reactive<{ subjectId?: number, startMonth?: string, endMonth?: string }>({}) // 搜索组件初始值
const queryParams = reactive({ // 查询参数
  startMonth: '',
  endMonth: '',
  subjectId: undefined as number | undefined,
})

const subjectOptions = computed(() => // 候选科目选项：启用数量核算的科目，支持选父级按子树汇总
  buildFmsSubjectOptions(subjects.value.filter(item => item.quantityAccounting)),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 计算借方单价 */
function getDebitUnitPrice(row: LedgerQuantityDetail) {
  return row.debitQuantity ? row.debitAmount / row.debitQuantity : undefined
}

/** 计算贷方单价 */
function getCreditUnitPrice(row: LedgerQuantityDetail) {
  return row.creditQuantity ? row.creditAmount / row.creditQuantity : undefined
}

/** 计算结存单价 */
function getBalanceUnitPrice(row: LedgerQuantityDetail) {
  return row.balanceQuantity ? row.balance / row.balanceQuantity : undefined
}

/** 查询数量金额明细账 */
async function getList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !queryParams.subjectId || !queryParams.startMonth || !queryParams.endMonth) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getLedgerQuantityDetailList({
      accountSetId,
      startMonth: queryParams.startMonth,
      endMonth: queryParams.endMonth,
      subjectId: queryParams.subjectId,
    })
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  queryParams.startMonth = data.startMonth
  queryParams.endMonth = data.endMonth
  queryParams.subjectId = data.subjectId
  getList()
}

/** 初始化：加载候选科目并渲染搜索组件，随后触发首次查询 */
async function initialize() {
  searchReady.value = false
  subjects.value = []
  list.value = []
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  if (!fmsStore.currentMonth) {
    await fmsStore.loadCurrentMonth()
  }
  subjects.value = await getSubjectList(accountSetId)
  if (accountSetId !== fmsStore.accountSet?.id) {
    return // 科目返回时账套已切换，丢弃本次初始化
  }
  initials.startMonth = fmsStore.currentMonth
  initials.endMonth = fmsStore.currentMonth
  initials.subjectId = subjectOptions.value[0]?.value
  queryParams.startMonth = initials.startMonth || ''
  queryParams.endMonth = initials.endMonth || ''
  queryParams.subjectId = initials.subjectId
  searchReady.value = true
  getList()
}

/** 账套切换后重新初始化 */
function handleAccountSetChange() {
  initialize()
}

/** 打开凭证详情 */
function openVoucher(row: LedgerQuantityDetail) {
  uni.navigateTo({ url: `/pages-fms/voucher/detail/index?id=${row.voucherId}` })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  initialize()
})
</script>
