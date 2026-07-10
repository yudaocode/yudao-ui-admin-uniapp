<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客户统计"
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
          <wd-form-item
            title="开始日期"
            title-width="160rpx"
            is-link
            :value="formatDate(filters.startTime)"
            placeholder="请选择开始日期"
            @click="startVisible = true"
          />
          <wd-datetime-picker
            v-model="filters.startTime"
            v-model:visible="startVisible"
            title="请选择开始日期"
            type="date"
            @confirm="loadData"
          />
          <wd-form-item
            title="结束日期"
            title-width="160rpx"
            is-link
            :value="formatDate(filters.endTime)"
            placeholder="请选择结束日期"
            @click="endVisible = true"
          />
          <wd-datetime-picker
            v-model="filters.endTime"
            v-model:visible="endVisible"
            title="请选择结束日期"
            type="date"
            @confirm="loadData"
          />
          <yd-form-picker
            v-model="filters.interval"
            label="时间间隔"
            label-width="160rpx"
            :dict-type="DICT_TYPE.DATE_INTERVAL"
            placeholder="请选择时间间隔"
            @confirm="handleIntervalConfirm"
          />
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
import type { StatisticsSection } from '@/pages-statistics/utils/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getContractSummary,
  getCustomerDealCycleByArea,
  getCustomerDealCycleByProduct,
  getCustomerDealCycleByUser,
  getCustomerSummaryByDate,
  getCustomerSummaryByUser,
  getFollowUpSummaryByDate,
  getFollowUpSummaryByType,
  getPoolSummaryByDate,
} from '@/api/crm/statistics/customer'
import { DeptFormPicker } from '@/components/system-select'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
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
  startTime: now.getTime() - 3600 * 1000 * 24 * 30,
  endTime: now.getTime(),
  interval: 2,
  deptId: getDefaultDeptId(userStore.userInfo),
  userId: undefined as number | undefined,
}) // 筛选条件
const loadingMap = ref<Record<string, boolean>>({}) // 各分类加载状态（每个 tab 自己的 loading）
const deptPickerRef = ref<InstanceType<typeof DeptFormPicker>>() // 部门选择器引用
const sectionData = ref<Record<string, any[]>>({}) // 各分类数据缓存（每个 tab 自己的 rows）
const tabIndex = ref(0) // 当前分类下标
const startVisible = ref(false) // 开始日期选择器显隐
const endVisible = ref(false) // 结束日期选择器显隐
const userPickerRef = ref<InstanceType<typeof UserFormPicker>>() // 员工选择器引用

const queryParams = computed(() => ({
  deptId: filters.deptId,
  interval: filters.interval,
  userId: filters.userId,
  times: formatDateRange([filters.startTime, filters.endTime]),
})) // 查询参数
const periodText = computed(() => {
  const times = queryParams.value.times || []
  return times.length === 2 ? `${formatDate(times[0])} 至 ${formatDate(times[1])}` : '默认统计周期'
})

const customerColumns = [
  { prop: 'time', label: '时间' },
  { prop: 'customerCreateCount', label: '新增客户' },
  { prop: 'customerDealCount', label: '成交客户' },
]
const sections = [
  {
    title: '客户总量（按日期）',
    columns: customerColumns,
    load: getCustomerSummaryByDate,
    chart: {
      type: 'line',
      categoryProp: 'time',
      series: [
        { name: '新增客户', prop: 'customerCreateCount' },
        { name: '成交客户', prop: 'customerDealCount' },
      ],
    },
  },
  {
    title: '客户总量（按用户）',
    columns: [
      { prop: 'ownerUserName', label: '负责人' },
      { prop: 'customerCreateCount', label: '新增客户' },
      { prop: 'customerDealCount', label: '成交客户' },
      { prop: 'customerDealRate', label: '客户成交率', type: 'percent' },
      { prop: 'contractPrice', label: '合同金额', type: 'money' },
      { prop: 'receivablePrice', label: '回款金额', type: 'money' },
      { prop: 'receivableRate', label: '回款完成率', type: 'percent' },
    ],
    load: async (params: Record<string, any>) => (await getCustomerSummaryByUser(params)).map((item: any) => ({
      ...item,
      // 客户成交率 = 成交客户 / 新增客户 × 100；回款完成率 = 回款金额 / 合同金额 × 100，对齐 PC CustomerSummary
      customerDealRate: item.customerCreateCount ? Number(((item.customerDealCount / item.customerCreateCount) * 100).toFixed(2)) : 0,
      receivableRate: item.contractPrice ? Number(((item.receivablePrice / item.contractPrice) * 100).toFixed(2)) : 0,
    })),
    chart: {
      type: 'bar',
      categoryProp: 'ownerUserName',
      series: [
        { name: '新增客户', prop: 'customerCreateCount' },
        { name: '成交客户', prop: 'customerDealCount' },
      ],
    },
  },
  {
    title: '跟进次数（按日期）',
    columns: [
      { prop: 'time', label: '时间' },
      { prop: 'followUpRecordCount', label: '跟进次数' },
      { prop: 'followUpCustomerCount', label: '跟进客户数' },
    ],
    load: getFollowUpSummaryByDate,
    chart: {
      type: 'line',
      categoryProp: 'time',
      series: [
        { name: '跟进次数', prop: 'followUpRecordCount' },
        { name: '跟进客户数', prop: 'followUpCustomerCount' },
      ],
    },
  },
  {
    title: '跟进方式',
    columns: [
      { prop: 'followUpType', label: '方式' },
      { prop: 'followUpRecordCount', label: '次数' },
    ],
    load: getFollowUpSummaryByType,
    chart: { type: 'pie', categoryProp: 'followUpType', valueProp: 'followUpRecordCount' },
  },
  {
    title: '客户转化率',
    columns: [
      { prop: 'time', label: '时间' },
      { prop: 'customerCreateCount', label: '新增客户' },
      { prop: 'customerDealCount', label: '成交客户' },
      { prop: 'conversionRate', label: '转化率', type: 'percent' },
    ],
    load: async (params: Record<string, any>) => (await getCustomerSummaryByDate(params)).map((item: any) => ({
      ...item,
      conversionRate: item.customerCreateCount ? Number(((item.customerDealCount / item.customerCreateCount) * 100).toFixed(2)) : 0,
    })), // 转化率 = 成交客户 / 新增客户 × 100，对齐 PC CustomerConversionStat
    chart: { type: 'line', categoryProp: 'time', series: [{ name: '转化率(%)', prop: 'conversionRate' }] },
  },
  {
    title: '合同摘要',
    columns: [
      { prop: 'customerName', label: '客户' },
      { prop: 'contractName', label: '合同' },
      { prop: 'totalPrice', label: '合同金额', type: 'money' },
      { prop: 'receivablePrice', label: '回款金额', type: 'money' },
    ],
    load: getContractSummary,
  },
  {
    title: '公海分析',
    columns: [
      { prop: 'time', label: '时间' },
      { prop: 'customerPutCount', label: '放入公海' },
      { prop: 'customerTakeCount', label: '领取公海' },
    ],
    load: getPoolSummaryByDate,
    chart: {
      type: 'line',
      categoryProp: 'time',
      series: [
        { name: '放入公海', prop: 'customerPutCount' },
        { name: '领取公海', prop: 'customerTakeCount' },
      ],
    },
  },
  {
    title: '成交周期（按用户）',
    columns: [
      { prop: 'ownerUserName', label: '负责人' },
      { prop: 'customerDealCycle', label: '成交周期' },
      { prop: 'customerDealCount', label: '成交客户' },
    ],
    load: getCustomerDealCycleByUser,
    chart: { type: 'bar', categoryProp: 'ownerUserName', series: [{ name: '成交周期', prop: 'customerDealCycle' }] },
  },
  {
    title: '成交周期（按地区）',
    columns: [
      { prop: 'areaName', label: '地区' },
      { prop: 'customerDealCycle', label: '成交周期' },
      { prop: 'customerDealCount', label: '成交客户' },
    ],
    load: getCustomerDealCycleByArea,
    chart: { type: 'bar', categoryProp: 'areaName', series: [{ name: '成交周期', prop: 'customerDealCycle' }] },
  },
  {
    title: '成交周期（按产品）',
    columns: [
      { prop: 'productName', label: '产品' },
      { prop: 'customerDealCycle', label: '成交周期' },
      { prop: 'customerDealCount', label: '成交客户' },
    ],
    load: getCustomerDealCycleByProduct,
    chart: { type: 'bar', categoryProp: 'productName', series: [{ name: '成交周期', prop: 'customerDealCycle' }] },
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
    sectionData.value[section.title] = normalizeRows(await section.load?.(queryParams.value))
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

/** 时间间隔确认 */
function handleIntervalConfirm() {
  loadData()
}

/** 部门变更 */
function handleDeptChange() {
  filters.userId = undefined
  loadData()
}

/** 初始化 */
onMounted(async () => {
  if (!filters.deptId) {
    filters.deptId = await deptPickerRef.value?.getFirstDeptId()
  }
  await loadData()
})
</script>
