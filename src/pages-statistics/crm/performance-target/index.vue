<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="业绩达成"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 筛选条件 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-8rpx shadow-sm">
          <wd-form-item title="选择年份" title-width="160rpx" is-link :value="formatDate(filters.year, 'YYYY')" placeholder="请选择年份" @click="yearVisible = true" />
          <wd-datetime-picker v-model="filters.year" v-model:visible="yearVisible" title="请选择年份" type="year" @confirm="loadData" />
          <wd-form-item title="目标类型" title-width="160rpx" is-link :value="bizTypeLabel" placeholder="请选择目标类型" @click="bizTypeVisible = true" />
          <wd-picker v-model:visible="bizTypeVisible" :model-value="filters.bizType" title="请选择目标类型" :columns="bizTypeColumns" @confirm="handleBizTypeConfirm" />
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
            {{ yearText }}
          </view>
          <wd-button size="small" type="primary" variant="plain" :loading="loading" @click="loadData">
            刷新
          </wd-button>
        </view>

        <!-- 统计列表 -->
        <StatisticsCard :section="section" :rows="rows" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import type { StatisticsSection } from '@/pages-statistics/utils/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import { BizTypeEnum } from '@/api/crm/permission'
import { getPerformanceTargetSummary } from '@/api/crm/statistics/performance-target'
import { getSimpleDeptList } from '@/api/system/dept'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { handleTree } from '@/utils/tree'
import {
  getDefaultDeptId,
  getFirstDeptId,
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
  bizType: BizTypeEnum.CRM_CONTRACT,
  deptId: getDefaultDeptId(userStore.userInfo),
  userId: undefined as number | undefined,
}) // 筛选条件
const loading = ref(false) // 加载状态
const deptTree = ref<Dept[]>([]) // 部门树形结构
const rows = ref<Record<string, any>[]>([]) // 列表数据
const yearVisible = ref(false) // 年份选择器显隐
const bizTypeVisible = ref(false) // 目标类型选择器显隐
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 员工选择器引用

const bizTypeColumns = [
  { label: '销售目标', value: BizTypeEnum.CRM_CONTRACT },
  { label: '回款目标', value: BizTypeEnum.CRM_RECEIVABLE },
] // 目标类型选项
const bizTypeLabel = computed(() => bizTypeColumns.find(item => item.value === filters.bizType)?.label || '销售目标')
const selectedYear = computed(() => filters.year ? new Date(filters.year).getFullYear() : now.getFullYear())
const yearText = computed(() => `${selectedYear.value} 年`)
const queryParams = computed(() => ({
  deptId: filters.deptId,
  userId: filters.userId,
  year: selectedYear.value,
  bizType: filters.bizType,
})) // 查询参数
const section = {
  title: '业绩达成',
  columns: [
    { prop: 'monthName', label: '月份' },
    { prop: 'targetPrice', label: '目标金额', type: 'money' },
    { prop: 'currentPrice', label: '完成金额', type: 'money' },
    { prop: 'completionRate', label: '完成率', type: 'percent' },
  ],
  chart: {
    type: 'bar',
    categoryProp: 'monthName',
    series: [
      { name: '目标金额', prop: 'targetPrice', type: 'bar' },
      { name: '完成金额', prop: 'currentPrice', type: 'bar' },
    ],
    money: true,
  },
} as StatisticsSection // 统计区块配置

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载业绩达成 */
async function loadData() {
  loading.value = true
  try {
    rows.value = normalizeRows(await getPerformanceTargetSummary(queryParams.value)).map(item => ({
      ...item,
      monthName: `${selectedYear.value}-${String(item.month).padStart(2, '0')}`,
    }))
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
}

/** 目标类型确认 */
function handleBizTypeConfirm({ value }: { value: (number | string)[] }) {
  filters.bizType = Number(value[0])
  loadData()
}

/** 部门变更 */
function handleDeptChange() {
  filters.userId = undefined
  loadData()
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
