<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="员工业绩"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 统计分类（固定 tab，避免一页过长） -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
        <wd-tab v-for="section in sections" :key="section.title" :title="section.title" />
      </wd-tabs>
    </view>

    <!-- 统计概览 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 筛选条件 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-8rpx shadow-sm">
          <wd-form-item title="选择年份" title-width="160rpx" is-link :value="formatDate(filters.year, 'YYYY')" placeholder="请选择年份" @click="yearVisible = true" />
          <wd-datetime-picker v-model="filters.year" v-model:visible="yearVisible" title="请选择年份" type="year" @confirm="loadData" />
          <DeptFormPicker
            ref="deptPickerRef"
            v-model="filters.deptId"
            label="归属部门"
            label-width="160rpx"
            placeholder="请选择归属部门"
            @change="handleDeptChange"
          />
          <UserFormPicker
            ref="userPickerRef"
            v-model="filters.userId"
            label="员工"
            label-width="160rpx"
            placeholder="请选择员工"
            @confirm="loadData"
          />
        </view>

        <!-- 统计周期与刷新 -->
        <view class="mb-24rpx flex items-center justify-between">
          <view class="text-26rpx text-[#999]">
            {{ periodText }}
          </view>
          <wd-button size="small" type="primary" variant="plain" :loading="!!loadingMap[activeSection.title]" @click="loadData">
            刷新
          </wd-button>
        </view>

        <!-- 统计列表（当前分类） -->
        <StatisticsCard :section="activeSection" :rows="sectionData[activeSection.title] || []" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { StatisticsColumn, StatisticsSection } from '@/pages-statistics/utils/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getContractCountPerformance,
  getContractPricePerformance,
  getContractSummary,
  getReceivablePricePerformance,
} from '@/api/crm/statistics/performance'
import { DeptFormPicker } from '@/components/system-select'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import {
  getDefaultDeptId,
  normalizeRows,
} from '@/pages-statistics/utils/statistics'
import StatisticsCard from '@/pages-statistics/components/card/statistics-card.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()
const now = new Date()
const filters = reactive({
  year: new Date(now.getFullYear(), 0, 1).getTime(),
  deptId: getDefaultDeptId(userStore.userInfo),
  userId: undefined as number | undefined,
}) // 筛选条件
const loadingMap = ref<Record<string, boolean>>({}) // 各分类加载状态（每个 tab 自己的 loading）
const deptPickerRef = ref<InstanceType<typeof DeptFormPicker>>() // 部门选择器引用
const sectionData = ref<Record<string, any[]>>({}) // 各分类数据缓存（每个 tab 自己的 rows）
const tabIndex = ref(0) // 当前分类下标
const yearVisible = ref(false) // 年份选择器显隐
const userPickerRef = ref<InstanceType<typeof UserFormPicker>>() // 员工选择器引用

const queryParams = computed(() => {
  const year = filters.year ? new Date(filters.year).getFullYear() : now.getFullYear()
  return {
    deptId: filters.deptId,
    userId: filters.userId,
    times: [
      formatDate(new Date(year, 0, 1), 'YYYY-MM-DD HH:mm:ss'),
      formatDate(new Date(year, 11, 31, 23, 59, 59), 'YYYY-MM-DD HH:mm:ss'),
    ],
  }
}) // 查询参数
const periodText = computed(() => {
  const times = queryParams.value.times || []
  return times.length === 2 ? `${formatDate(times[0])} 至 ${formatDate(times[1])}` : '默认统计周期'
})
const sections = [
  {
    title: '合同金额业绩',
    columns: performanceColumns('合同金额'),
    load: getContractPricePerformance,
    chart: performanceChart('合同金额'),
    transform: rows => rows.map(withPerformanceGrowthRate),
  },
  {
    title: '回款金额业绩',
    columns: performanceColumns('回款金额'),
    load: getReceivablePricePerformance,
    chart: performanceChart('回款金额'),
    transform: rows => rows.map(withPerformanceGrowthRate),
  },
  {
    title: '签约合同数业绩',
    columns: performanceColumns('合同数'),
    load: getContractCountPerformance,
    chart: performanceChart('合同数'),
    transform: rows => rows.map(withPerformanceGrowthRate),
  },
  {
    title: '合同汇总表',
    columns: [
      { prop: 'time', label: '月份' },
      { prop: 'contractCount', label: '合同数量' },
      { prop: 'contractPrice', label: '合同金额', type: 'money' },
      { prop: 'receivablePrice', label: '回款金额', type: 'money' },
      { prop: 'unreceivedPrice', label: '未回款金额', type: 'money' },
    ],
    load: getContractSummary,
    chart: {
      type: 'bar',
      categoryProp: 'time',
      series: [
        { name: '合同金额', prop: 'contractPrice', type: 'bar' },
        { name: '回款金额', prop: 'receivablePrice', type: 'bar' },
        { name: '未回款金额', prop: 'unreceivedPrice', type: 'line' },
      ],
      money: true,
    },
  },
] as StatisticsSection[] // 统计分组配置
const activeSection = computed(() => sections[tabIndex.value] || sections[0]) // 当前分类

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载当前分类数据：写入各自缓存槽，捕获 section 防止快速切 tab 时旧响应覆盖 */
async function loadActive() {
  const section = activeSection.value
  loadingMap.value[section.title] = true
  try {
    const rows = normalizeRows(await section.load?.(queryParams.value))
    sectionData.value[section.title] = section.transform ? section.transform(rows) : rows
  } catch {
    sectionData.value[section.title] = []
  } finally {
    loadingMap.value[section.title] = false
  }
}

/** 筛选 / 刷新：清空各分类缓存并重新加载当前分类 */
function loadData() {
  sectionData.value = {}
  loadActive()
}

/** 切换分类：已加载过则直接用缓存，未加载才请求 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  if (sectionData.value[activeSection.value.title] === undefined) {
    loadActive()
  }
}

/** 部门变更 */
function handleDeptChange() {
  filters.userId = undefined
  loadData()
}

/** 计算业绩增长率：环比 =(当期-上期)/上期，同比 =(当期-去年同期)/去年同期；除数为 0 时返回 null（展示为 -） */
function withPerformanceGrowthRate(row: Record<string, any>) {
  const current = Number(row.currentMonthCount) || 0
  const lastMonth = Number(row.lastMonthCount) || 0
  const lastYear = Number(row.lastYearCount) || 0
  return {
    ...row,
    momGrowthRate: lastMonth !== 0 ? (((current - lastMonth) / lastMonth) * 100).toFixed(2) : null,
    yoyGrowthRate: lastYear !== 0 ? (((current - lastYear) / lastYear) * 100).toFixed(2) : null,
  }
}

/** 业绩列：包含当期/上期/去年同期，以及环比、同比增长率 */
function performanceColumns(label: string): StatisticsColumn[] {
  return [
    { prop: 'time', label: '时间' },
    { prop: 'currentMonthCount', label: `当期${label}` },
    { prop: 'lastMonthCount', label: `上期${label}` },
    { prop: 'lastYearCount', label: `去年同期${label}` },
    { prop: 'momGrowthRate', label: '环比增长率', type: 'percent' },
    { prop: 'yoyGrowthRate', label: '同比增长率', type: 'percent' },
  ]
}

/** 业绩图表配置 */
function performanceChart(label: string): StatisticsSection['chart'] {
  return {
    type: 'line',
    categoryProp: 'time',
    money: label.includes('金额'),
    series: [
      { name: `当期${label}`, prop: 'currentMonthCount' },
      { name: `上期${label}`, prop: 'lastMonthCount' },
      { name: `去年同期${label}`, prop: 'lastYearCount' },
    ],
  }
}

/** 初始化 */
onMounted(async () => {
  if (!filters.deptId) {
    filters.deptId = await deptPickerRef.value?.getFirstDeptId()
  }
  await loadData()
})
</script>
