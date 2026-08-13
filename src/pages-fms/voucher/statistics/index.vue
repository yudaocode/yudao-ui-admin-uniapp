<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="凭证汇总"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="hasAccessByCodes(['fms:voucher:statistics:query'])">
      <template v-if="fmsStore.accountSet">
        <!-- 账套切换 -->
        <view class="p-24rpx pb-0">
          <AccountSetSwitch @change="init" />
        </view>

        <!-- TODO @AI：这个搜索，要不要做成组件噢？ -->
        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view class="p-24rpx">
            <!-- 筛选区域 -->
            <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
              <view class="yd-search-form-item">
                <view class="yd-search-form-label">
                  会计期间
                </view>
                <view class="flex items-center gap-12rpx">
                  <view
                    class="flex-1 rounded-12rpx bg-[#f7f8fa] p-24rpx text-28rpx"
                    :class="queryParams.startMonth ? 'text-[#333]' : 'text-[#999]'"
                    @click="startMonthVisible = true"
                  >
                    {{ queryParams.startMonth || '开始期间' }}
                  </view>
                  <text class="text-28rpx text-[#999]">至</text>
                  <view
                    class="flex-1 rounded-12rpx bg-[#f7f8fa] p-24rpx text-28rpx"
                    :class="queryParams.endMonth ? 'text-[#333]' : 'text-[#999]'"
                    @click="endMonthVisible = true"
                  >
                    {{ queryParams.endMonth || '结束期间' }}
                  </view>
                </view>
                <wd-datetime-picker
                  v-model="startMonthPicker"
                  v-model:visible="startMonthVisible"
                  title="请选择开始期间"
                  type="year-month"
                  @confirm="handleStartMonthConfirm"
                />
                <wd-datetime-picker
                  v-model="endMonthPicker"
                  v-model:visible="endMonthVisible"
                  title="请选择结束期间"
                  type="year-month"
                  @confirm="handleEndMonthConfirm"
                />
              </view>
              <yd-search-picker
                v-model="queryParams.voucherWordId"
                label="凭证字"
                :columns="voucherWordOptions"
                all-option
              />
              <view class="yd-search-form-item">
                <view class="yd-search-form-label">
                  凭证号
                </view>
                <view class="flex items-center gap-12rpx">
                  <wd-input
                    v-model.number="queryParams.minVoucherNumber"
                    class="flex-1"
                    type="number"
                    placeholder="起始号"
                    clearable
                  />
                  <text class="text-28rpx text-[#999]">至</text>
                  <wd-input
                    v-model.number="queryParams.maxVoucherNumber"
                    class="flex-1"
                    type="number"
                    placeholder="结束号"
                    clearable
                  />
                </view>
              </view>
              <view class="yd-search-form-item">
                <view class="yd-search-form-label">
                  科目级次
                </view>
                <view class="flex items-center gap-12rpx">
                  <wd-input
                    v-model.number="queryParams.minLevel"
                    class="flex-1"
                    type="number"
                    placeholder="最小级次"
                    clearable
                  />
                  <text class="text-28rpx text-[#999]">至</text>
                  <wd-input
                    v-model.number="queryParams.maxLevel"
                    class="flex-1"
                    type="number"
                    placeholder="最大级次"
                    clearable
                  />
                </view>
              </view>
              <view class="yd-search-form-actions">
                <wd-button class="flex-1" variant="plain" @click="handleReset">
                  重置
                </wd-button>
                <wd-button class="flex-1" type="primary" :loading="loading" @click="handleQuery">
                  查询
                </wd-button>
              </view>
            </view>

            <!-- 汇总结果 -->
            <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
              <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
                {{ formatFmsPeriodLabel(queryParams.startMonth, queryParams.endMonth) }}
              </view>
              <view class="text-26rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">借方总计：</text>{{ formatFmsAmount(totalDebitAmount) }}
                <text class="mx-16rpx text-[#999]">贷方总计：</text>{{ formatFmsAmount(totalCreditAmount) }}
              </view>
            </view>

            <!-- 加载状态 -->
            <view
              v-if="loading && !list.length"
              class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm"
            >
              <wd-loading size="32rpx" />
              <view class="mt-12rpx">
                正在加载汇总数据
              </view>
            </view>

            <!-- 科目汇总列表 -->
            <view
              v-for="item in list"
              :key="item.subjectId"
              class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            >
              <view class="mb-12rpx flex items-center justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                  {{ item.subjectCode }} {{ item.subjectName }}
                </view>
                <wd-tag type="primary" plain>
                  {{ item.level }} 级
                </wd-tag>
              </view>
              <view class="flex items-center justify-between text-26rpx text-[#666]">
                <text><text class="mr-8rpx text-[#999]">借方：</text>{{ formatFmsAmount(item.debitAmount) }}</text>
                <text><text class="mr-8rpx text-[#999]">贷方：</text>{{ formatFmsAmount(item.creditAmount) }}</text>
              </view>
            </view>

            <!-- 空状态 -->
            <view
              v-if="!loading && !list.length"
              class="rounded-12rpx bg-white py-64rpx text-center text-28rpx text-[#999] shadow-sm"
            >
              暂无凭证汇总数据
            </view>
          </view>
          <view class="h-40rpx" />
        </scroll-view>
      </template>

      <!-- 无可用账套引导 -->
      <AccountSetGuide v-else-if="fmsStore.accountSetListLoaded" />
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import type { VoucherStatistics, VoucherStatisticsReq } from '@/api/fms/voucher'
import dayjs from 'dayjs'
import { getVoucherWordSimpleList } from '@/api/fms/config/voucher-word'
import { getVoucherStatisticsList } from '@/api/fms/voucher'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set-guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set-switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { formatFmsAmount, formatFmsMonth, formatFmsPeriodLabel, parseFmsMonth } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const loading = ref(false) // 汇总加载状态
const list = ref<VoucherStatistics[]>([]) // 汇总列表
const voucherWords = ref<VoucherWord[]>([]) // 凭证字选项来源
const queryParams = ref<VoucherStatisticsReq>({ // 查询参数，默认当前期间的一级科目
  accountSetId: 0,
  startMonth: '',
  endMonth: '',
  minLevel: 1,
  maxLevel: 1,
})
const startMonthVisible = ref(false) // 开始期间选择器显隐
const endMonthVisible = ref(false) // 结束期间选择器显隐
const startMonthPicker = ref<number | string>('') // 开始期间本地值
const endMonthPicker = ref<number | string>('') // 结束期间本地值

/** 凭证字选项 */
const voucherWordOptions = computed(() =>
  voucherWords.value.map(item => ({ label: item.name, value: item.id! })),
)
/** 借方总计（按最小科目级次行汇总，与 PC 合计行口径一致） */
const totalDebitAmount = computed(() =>
  list.value
    .filter(item => item.level === queryParams.value.minLevel)
    .reduce((sum, item) => sum + Number(item.debitAmount || 0), 0),
)
/** 贷方总计（按最小科目级次行汇总，与 PC 合计行口径一致） */
const totalCreditAmount = computed(() =>
  list.value
    .filter(item => item.level === queryParams.value.minLevel)
    .reduce((sum, item) => sum + Number(item.creditAmount || 0), 0),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询凭证汇总列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await getVoucherStatisticsList(queryParams.value)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
async function init() {
  list.value = []
  voucherWords.value = []
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const [wordList, month] = await Promise.all([
    getVoucherWordSimpleList(accountSetId),
    fmsStore.loadCurrentMonth(),
  ])
  if (fmsStore.accountSet?.id !== accountSetId) {
    return // 数据返回时账套已切换，丢弃过期结果
  }
  voucherWords.value = wordList
  const currentMonth = month || dayjs().format('YYYY-MM')
  queryParams.value = {
    accountSetId,
    startMonth: currentMonth,
    endMonth: currentMonth,
    minLevel: 1,
    maxLevel: 1,
  }
  startMonthPicker.value = parseFmsMonth(currentMonth)
  endMonthPicker.value = parseFmsMonth(currentMonth)
  await getList()
}

/** 查询按钮操作 */
function handleQuery() {
  if (!queryParams.value.startMonth || !queryParams.value.endMonth) {
    return
  }
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  init()
}

/** 开始期间选择确认 */
function handleStartMonthConfirm() {
  const month = startMonthPicker.value ? formatFmsMonth(Number(startMonthPicker.value)) : ''
  if (month) {
    queryParams.value.startMonth = month
  }
}

/** 结束期间选择确认 */
function handleEndMonthConfirm() {
  const month = endMonthPicker.value ? formatFmsMonth(Number(endMonthPicker.value)) : ''
  if (month) {
    queryParams.value.endMonth = month
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await init()
})
</script>
