<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="产品分析"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 统计分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
        <wd-tab v-for="section in sections" :key="section.title" :title="section.title" />
      </wd-tabs>
    </view>

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 筛选条件 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-8rpx shadow-sm">
          <wd-form-item title="开始日期" title-width="160rpx" is-link :value="formatDate(filters.startTime)" placeholder="请选择开始日期" @click="startVisible = true" />
          <wd-datetime-picker v-model="filters.startTime" v-model:visible="startVisible" title="请选择开始日期" type="date" @confirm="loadData" />
          <wd-form-item title="结束日期" title-width="160rpx" is-link :value="formatDate(filters.endTime)" placeholder="请选择结束日期" @click="endVisible = true" />
          <wd-datetime-picker v-model="filters.endTime" v-model:visible="endVisible" title="请选择结束日期" type="date" @confirm="loadData" />
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
          <yd-tree-select
            v-model="filters.categoryId"
            label="产品分类"
            label-width="160rpx"
            filterable
            :data="categoryTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择产品分类"
            @change="loadData"
          />
          <yd-search-picker
            v-model="filters.productId"
            label="产品"
            :columns="productList"
            label-key="name"
            value-key="id"
            placeholder="请选择产品"
            @update:model-value="loadData"
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

        <!-- 统计列表 -->
        <StatisticsCard :section="activeSection" :rows="sectionData[activeSection.title] || []" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/crm/product'
import type { ProductCategory } from '@/api/crm/product/category'
import type { StatisticsSection } from '@/pages-statistics/utils/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import { getProductCategoryList } from '@/api/crm/product/category'
import { getProductSimpleList } from '@/api/crm/product'
import {
  getProductCategorySummary,
  getProductSalesList,
} from '@/api/crm/statistics/product'
import { DeptFormPicker } from '@/components/system-select'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { formatDate, formatDateRange } from '@/utils/date'
import { handleTree } from '@/utils/tree'
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
  deptId: getDefaultDeptId(userStore.userInfo),
  userId: undefined as number | undefined,
  categoryId: undefined as number | undefined,
  productId: undefined as number | undefined,
}) // 筛选条件
const loadingMap = ref<Record<string, boolean>>({}) // 各分类加载状态
const deptPickerRef = ref<InstanceType<typeof DeptFormPicker>>() // 部门选择器引用
const categoryTree = ref<ProductCategory[]>([]) // 产品分类树
const productList = ref<Product[]>([]) // 产品列表
const sectionData = ref<Record<string, any[]>>({}) // 各分类数据缓存
const tabIndex = ref(0) // 当前分类下标
const startVisible = ref(false) // 开始日期选择器显隐
const endVisible = ref(false) // 结束日期选择器显隐
const userPickerRef = ref<InstanceType<typeof UserFormPicker>>() // 员工选择器引用

const queryParams = computed(() => ({
  deptId: filters.deptId,
  userId: filters.userId,
  categoryId: filters.categoryId,
  productId: filters.productId,
  times: formatDateRange([filters.startTime, filters.endTime]),
})) // 查询参数
const periodText = computed(() => {
  const times = queryParams.value.times || []
  return times.length === 2 ? `${formatDate(times[0])} 至 ${formatDate(times[1])}` : '默认统计周期'
})

const sections = [
  {
    title: '产品销售情况',
    columns: [
      { prop: 'categoryName', label: '产品分类' },
      { prop: 'productName', label: '产品名称' },
      { prop: 'contractNo', label: '合同编号' },
      { prop: 'contractName', label: '合同名称' },
      { prop: 'ownerUserName', label: '负责人' },
      { prop: 'customerName', label: '客户名称' },
      { prop: 'productPrice', label: '销售单价', type: 'money' },
      { prop: 'productCount', label: '数量' },
      { prop: 'productTotalPrice', label: '订单产品小计', type: 'money' },
    ],
    load: getProductSalesList,
  },
  {
    title: '产品分类销量占比',
    columns: [
      { prop: 'categoryName', label: '产品分类' },
      { prop: 'contractCount', label: '合同数量' },
      { prop: 'productCount', label: '销售数量' },
      { prop: 'productTotalPrice', label: '销售金额', type: 'money' },
    ],
    load: getProductCategorySummary,
    chart: { type: 'pie', categoryProp: 'categoryName', valueProp: 'productCount' },
  },
] as StatisticsSection[] // 统计分组配置
const activeSection = computed(() => sections[tabIndex.value] || sections[0]) // 当前分类

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载当前分类数据 */
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

/** 筛选 / 刷新 */
function loadData() {
  sectionData.value = {}
  loadActive()
}

/** 切换分类 */
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

/** 初始化 */
onMounted(async () => {
  const [productCategoryList, products] = await Promise.all([
    getProductCategoryList({}),
    getProductSimpleList(),
  ])
  categoryTree.value = handleTree(productCategoryList)
  productList.value = products
  if (!filters.deptId) {
    filters.deptId = await deptPickerRef.value?.getFirstDeptId()
  }
  await loadData()
})
</script>
