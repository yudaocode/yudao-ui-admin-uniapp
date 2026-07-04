<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客户画像"
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
          <wd-form-item title="开始日期" title-width="160rpx" is-link :value="formatDate(filters.startTime)" placeholder="请选择开始日期" @click="startVisible = true" />
          <wd-datetime-picker v-model="filters.startTime" v-model:visible="startVisible" title="请选择开始日期" type="date" @confirm="loadData" />
          <wd-form-item title="结束日期" title-width="160rpx" is-link :value="formatDate(filters.endTime)" placeholder="请选择结束日期" @click="endVisible = true" />
          <wd-datetime-picker v-model="filters.endTime" v-model:visible="endVisible" title="请选择结束日期" type="date" @confirm="loadData" />
          <yd-tree-select
            v-model="filters.deptId"
            label="归属部门"
            label-width="160rpx"
            filterable
            :data="deptTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择归属部门"
            @change="handleDeptChange"
          />
          <UserPicker
            ref="userPickerRef"
            v-model="filters.userId"
            type="radio"
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
import type { Dept } from '@/api/system/dept'
import type { StatisticsColumn, StatisticsSection } from '@/pages-statistics/utils/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getCustomerArea,
  getCustomerIndustry,
  getCustomerLevel,
  getCustomerSource,
} from '@/api/crm/statistics/portrait'
import { getSimpleDeptList } from '@/api/system/dept'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { handleTree } from '@/utils/tree'
import {
  getDefaultDeptId,
  getFirstDeptId,
  normalizeRows,
} from '@/pages-statistics/utils/statistics'
import StatisticsCard from '@/pages-statistics/components/card/statistics-card.vue'
import { toNumber } from '@/utils/format'

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
  deptId: getDefaultDeptId(userStore.userInfo),
  userId: undefined as number | undefined,
}) // 筛选条件
const loadingMap = ref<Record<string, boolean>>({}) // 各分类加载状态（每个 tab 自己的 loading）
const deptTree = ref<Dept[]>([]) // 部门树形结构
const sectionData = ref<Record<string, any[]>>({}) // 各分类数据缓存（每个 tab 自己的 rows）
const tabIndex = ref(0) // 当前分类下标
const startVisible = ref(false) // 开始日期选择器显隐
const endVisible = ref(false) // 结束日期选择器显隐
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 员工选择器引用

const queryParams = computed(() => ({
  deptId: filters.deptId,
  userId: filters.userId,
  times: formatDateRange([filters.startTime, filters.endTime]),
})) // 查询参数
const periodText = computed(() => {
  const times = queryParams.value.times || []
  return times.length === 2 ? `${formatDate(times[0])} 至 ${formatDate(times[1])}` : '默认统计周期'
})
const sections = [
  {
    title: '地区分布',
    columns: portraitColumns('areaName', '地区'),
    load: getCustomerArea,
    chart: { type: 'pie', categoryProp: 'areaName', valueProp: 'customerCount' },
  },
  {
    title: '客户级别',
    columns: portraitColumns('level', '级别', DICT_TYPE.CRM_CUSTOMER_LEVEL),
    load: getCustomerLevel,
    chart: { type: 'pie', categoryProp: 'level', valueProp: 'customerCount' },
  },
  {
    title: '客户来源',
    columns: portraitColumns('source', '来源', DICT_TYPE.CRM_CUSTOMER_SOURCE),
    load: getCustomerSource,
    chart: { type: 'pie', categoryProp: 'source', valueProp: 'customerCount' },
  },
  {
    title: '所属行业',
    columns: portraitColumns('industryId', '行业', DICT_TYPE.CRM_CUSTOMER_INDUSTRY),
    load: getCustomerIndustry,
    chart: { type: 'pie', categoryProp: 'industryId', valueProp: 'customerCount' },
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
    sectionData.value[section.title] = withPortions(normalizeRows(await section.load?.(queryParams.value)))
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

/** 画像列 */
function portraitColumns(prop: string, label: string, dictType?: string): StatisticsColumn[] {
  return [
    { prop, label, dictType },
    { prop: 'customerCount', label: '客户数' },
    { prop: 'customerPortion', label: '客户占比', type: 'percent' },
    { prop: 'dealCount', label: '成交数' },
    { prop: 'dealPortion', label: '成交占比', type: 'percent' },
  ]
}

/** 计算占比列：客户占比 = 客户数/Σ客户数，成交占比 = 成交数/Σ成交数（后端不返回，与 PC calculateProportion 对齐前端计算） */
function withPortions(rows: Record<string, any>[]) {
  const totalCustomer = rows.reduce((sum, row) => sum + toNumber(row.customerCount), 0)
  const totalDeal = rows.reduce((sum, row) => sum + toNumber(row.dealCount), 0)
  return rows.map(row => ({
    ...row,
    customerPortion: totalCustomer ? Math.round((toNumber(row.customerCount) / totalCustomer) * 10000) / 100 : 0,
    dealPortion: totalDeal ? Math.round((toNumber(row.dealCount) / totalDeal) * 10000) / 100 : 0,
  }))
}

/** 初始化 */
onMounted(async () => {
  deptTree.value = handleTree(await getSimpleDeptList())
  if (!filters.deptId) {
    filters.deptId = getFirstDeptId(deptTree.value)
  }
  await loadData()
})
</script>
