<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="利润表"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="hasAccessByCodes(['fms:report:income-statement:query'])">
      <template v-if="fmsStore.accountSet">
        <!-- 账套切换 -->
        <view class="p-24rpx pb-0">
          <AccountSetSwitch />
        </view>

        <!-- 期间筛选 -->
        <view class="p-24rpx pb-0">
          <ReportPeriodBar @query="handleQuery" />
        </view>

        <!-- 报表内容 -->
        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view class="p-24rpx space-y-24rpx">
            <!-- 加载状态 -->
            <view
              v-if="loading"
              class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm"
            >
              <wd-loading size="32rpx" />
              <view class="mt-12rpx">
                正在加载报表数据
              </view>
            </view>

            <!-- 利润表行 -->
            <ReportRowList v-else :rows="rows" primary-label="本年累计金额" secondary-label="本期金额" />
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
import type { ReportItem } from '@/api/fms/report'
import type { ReportDisplayRow } from '@/pages-fms/report/components/report-row-list.vue'
import { getIncomeStatement } from '@/api/fms/report'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import ReportPeriodBar from '@/pages-fms/report/components/report-period-bar.vue'
import ReportRowList from '@/pages-fms/report/components/report-row-list.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()

const loading = ref(false) // 报表加载状态
const list = ref<ReportItem[]>([]) // 利润表项目列表
const queryParams = reactive({ // 查询参数
  startMonth: '',
  endMonth: '',
})

/** 展示行：小计 / 合计行（不可编辑公式）加粗 */
const rows = computed<ReportDisplayRow[]>(() =>
  list.value.map(item => ({
    key: item.id,
    name: item.name,
    rowNo: item.rowNo,
    level: item.level,
    bold: !item.editable,
    primaryAmount: item.yearAmount,
    secondaryAmount: item.currentAmount,
  })),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 期间筛选查询 */
function handleQuery(value: { startMonth: string, endMonth: string }) {
  Object.assign(queryParams, value)
  getList()
}

/** 查询利润表 */
async function getList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !queryParams.endMonth) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getIncomeStatement(accountSetId, queryParams.startMonth, queryParams.endMonth)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
})
</script>
