<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="明细账"
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
          search-placeholder="搜索明细账"
          @search="handleQuery"
          @reset="handleQuery"
        />

        <!-- 明细账列表 -->
        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view class="p-24rpx">
            <!-- 加载状态 -->
            <view
              v-if="!subjectsLoadFailed && (loading || !searchReady)"
              class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm"
            >
              <wd-loading size="32rpx" />
              <view class="mt-12rpx">
                正在加载账簿数据
              </view>
            </view>

            <!-- 候选科目加载失败 -->
            <view
              v-else-if="subjectsLoadFailed"
              class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm"
            >
              <view>候选科目加载失败</view>
              <wd-button class="mt-16rpx" size="small" type="primary" plain @click="handleRetrySubjects">
                重新加载
              </wd-button>
            </view>

            <view v-else-if="list.length" class="overflow-hidden rounded-12rpx bg-white shadow-sm">
              <!-- 科目标题 -->
              <view class="border-0 border-b border-[#eee] border-b-solid px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
                {{ list[0].subjectCode }} {{ list[0].subjectName }}
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
                  <view class="flex flex-wrap items-center gap-x-24rpx gap-y-4rpx text-26rpx text-[#666]">
                    <text>借方 {{ formatFmsMoney(row.debitAmount) }}</text>
                    <text>贷方 {{ formatFmsMoney(row.creditAmount) }}</text>
                    <text>余额 {{ formatFmsSubjectBalance(row.balance, row.balanceDirection) }}</text>
                  </view>
                </view>
                <!-- 汇总行（期初、本期合计、本年累计、期末余额） -->
                <view
                  v-else
                  class="flex flex-wrap items-center gap-x-24rpx gap-y-4rpx border-0 border-b border-[#f5f5f5] border-b-solid bg-[#fafafa] px-24rpx py-16rpx text-26rpx text-[#333] font-semibold"
                >
                  <text class="min-w-140rpx">{{ row.digest }}</text>
                  <text>借 {{ formatFmsMoney(row.debitAmount) }}</text>
                  <text>贷 {{ formatFmsMoney(row.creditAmount) }}</text>
                  <text>余 {{ formatFmsSubjectBalance(row.balance, row.balanceDirection) }}</text>
                </view>
              </view>
            </view>

            <!-- 空状态 -->
            <view v-else class="rounded-12rpx bg-white py-96rpx shadow-sm">
              <wd-empty icon="content" :tip="subjects.length ? '暂无明细账数据' : '当前期间暂无有发生额的科目'" />
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
import type { LedgerDetail, LedgerDetailSubject } from '@/api/fms/ledger'
import { FmsLedgerRowType, getLedgerDetailList, getLedgerDetailSubjectList } from '@/api/fms/ledger'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import SearchForm from '@/pages-fms/ledger/components/search-form.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { buildFmsSubjectOptions, formatFmsMoney, formatFmsSubjectBalance } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{
  subjectId?: number // 下钻传入的科目编号
  startMonth?: string // 下钻传入的开始期间
  endMonth?: string // 下钻传入的结束期间
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const loading = ref(false) // 账簿加载状态
const list = ref<LedgerDetail[]>([]) // 明细账行列表
const subjects = ref<LedgerDetailSubject[]>([]) // 期间有发生额的候选科目（含父级节点）
const subjectsLoadFailed = ref(false) // 候选科目是否加载失败，失败时展示重试入口而非空态
const searchReady = ref(false) // 搜索组件是否就绪，候选科目加载完成后渲染
const initials = reactive<{ subjectId?: number, startMonth?: string, endMonth?: string }>({}) // 搜索组件初始值
const queryParams = reactive({ // 查询参数
  startMonth: '',
  endMonth: '',
  subjectId: undefined as number | undefined,
})

const subjectOptions = computed(() => buildFmsSubjectOptions(subjects.value)) // 候选科目选项

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询明细账 */
async function getList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !queryParams.subjectId || !queryParams.startMonth || !queryParams.endMonth) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getLedgerDetailList({
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
async function handleQuery(data: Record<string, any>) {
  const periodChanged = data.startMonth !== queryParams.startMonth || data.endMonth !== queryParams.endMonth
  queryParams.startMonth = data.startMonth
  queryParams.endMonth = data.endMonth
  queryParams.subjectId = data.subjectId
  if (!periodChanged) {
    getList()
    return
  }
  // 期间变化后重新加载候选科目，当前科目失效时回退到首个候选并重建搜索组件
  const accountSetId = fmsStore.accountSet?.id
  try {
    subjects.value = accountSetId && queryParams.startMonth && queryParams.endMonth
      ? await getLedgerDetailSubjectList({
          accountSetId,
          startMonth: queryParams.startMonth,
          endMonth: queryParams.endMonth,
        })
      : []
  } catch {
    subjectsLoadFailed.value = true // 候选科目接口失败时展示重试入口，不伪装成空数据
    return
  }
  if (queryParams.subjectId && !subjects.value.some(item => item.id === queryParams.subjectId)) {
    queryParams.subjectId = subjectOptions.value[0]?.value
    initials.startMonth = queryParams.startMonth
    initials.endMonth = queryParams.endMonth
    initials.subjectId = queryParams.subjectId
    searchReady.value = false
    await nextTick()
    searchReady.value = true
  }
  getList()
}

/** 初始化：加载候选科目并渲染搜索组件，随后触发首次查询 */
async function initialize() {
  searchReady.value = false
  subjectsLoadFailed.value = false
  subjects.value = []
  list.value = []
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  if (!fmsStore.currentMonth) {
    await fmsStore.loadCurrentMonth()
  }
  initials.startMonth = props.startMonth || fmsStore.currentMonth
  initials.endMonth = props.endMonth || fmsStore.currentMonth
  if (initials.startMonth && initials.endMonth) {
    try {
      subjects.value = await getLedgerDetailSubjectList({
        accountSetId,
        startMonth: initials.startMonth,
        endMonth: initials.endMonth,
      })
    } catch {
      subjectsLoadFailed.value = true // 候选科目接口失败时展示重试入口，不伪装成空数据
      return
    }
  }
  if (accountSetId !== fmsStore.accountSet?.id) {
    return // 候选返回时账套已切换，丢弃本次初始化
  }
  const drillSubjectId = props.subjectId ? Number(props.subjectId) : undefined
  initials.subjectId = drillSubjectId && subjects.value.some(item => item.id === drillSubjectId)
    ? drillSubjectId
    : subjectOptions.value[0]?.value
  queryParams.startMonth = initials.startMonth || ''
  queryParams.endMonth = initials.endMonth || ''
  queryParams.subjectId = initials.subjectId
  searchReady.value = true
  getList()
}

/** 候选科目加载失败后重试 */
function handleRetrySubjects() {
  initialize()
}

/** 账套切换后重新初始化 */
function handleAccountSetChange() {
  initialize()
}

/** 打开凭证详情 */
function openVoucher(row: LedgerDetail) {
  uni.navigateTo({ url: `/pages-fms/voucher/detail/index?id=${row.voucherId}` })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  initialize()
})
</script>
