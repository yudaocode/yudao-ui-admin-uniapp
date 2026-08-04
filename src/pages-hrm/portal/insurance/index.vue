<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我的社保"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <!-- 搜索组件 -->
      <SearchForm
        :year="queryYear"
        :first-year="firstYear"
        @search="handleQuery"
        @reset="handleReset"
      />

      <!-- 社保记录列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-enabled="false"
        empty-view-text="暂无社保数据"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleDetail(item)"
          >
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ formatHrmYearMonth(item.year, item.month) }}
              </view>
              <dict-tag
                v-if="item.schemeType != null"
                :type="DICT_TYPE.HRM_INSURANCE_SCHEME_TYPE"
                :value="item.schemeType"
              />
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">参保方案：</text>{{ item.schemeName || '-' }}
            </view>
            <view v-if="item.schemeCity" class="mb-12rpx text-26rpx text-[#999]">
              {{ item.schemeCity }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">个人社保：</text>{{ formatHrmMoney(item.personalInsuranceAmount) }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">公司社保：</text>{{ formatHrmMoney(item.corporateInsuranceAmount) }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">个人公积金：</text>{{ formatHrmMoney(item.personalProvidentFundAmount) }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">公司公积金：</text>{{ formatHrmMoney(item.corporateProvidentFundAmount) }}
            </view>
            <view class="text-28rpx text-[#1677ff] font-semibold">
              <text class="mr-8rpx text-[#999] font-normal">合计：</text>{{ formatHrmMoney(recordTotal(item)) }}
            </view>
          </view>
        </view>
      </z-paging>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { PortalInsuranceRecord } from '@/api/hrm/portal/insurance/record'
import { onMounted, ref } from 'vue'
import { getPortalInsuranceRecordList } from '@/api/hrm/portal/insurance/record'
import { formatHrmMoney, formatHrmYearMonth } from '@/pages-hrm/utils/format'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const accessible = ref(false) // 是否可访问
const list = ref<PortalInsuranceRecord[]>([]) // 当前年份列表
const allRecords = ref<PortalInsuranceRecord[]>([]) // 全部参保记录
const pagingRef = ref<any>() // 分页组件引用
const queryYear = ref(new Date().getFullYear()) // 查询年份
const firstYear = ref<number>() // 首个参保年份
const yearInited = ref(false) // 是否已按最近记录初始化年份

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 计算个人缴纳合计 */
function personalTotal(record: PortalInsuranceRecord) {
  return (record.personalInsuranceAmount || 0) + (record.personalProvidentFundAmount || 0)
}

/** 计算公司缴纳合计 */
function corporateTotal(record: PortalInsuranceRecord) {
  return (record.corporateInsuranceAmount || 0) + (record.corporateProvidentFundAmount || 0)
}

/** 计算参保记录合计 */
function recordTotal(record: PortalInsuranceRecord) {
  return personalTotal(record) + corporateTotal(record)
}

/** 按年份过滤列表 */
function loadRecords() {
  list.value = allRecords.value.filter(record => record.year === queryYear.value)
  pagingRef.value?.completeByTotal(list.value, list.value.length)
}

/** 查询社保记录列表 */
async function queryList() {
  try {
    allRecords.value = (await getPortalInsuranceRecordList()) || []
    const years = allRecords.value.map(record => record.year)
    if (years.length) {
      firstYear.value = Math.min(...years)
      if (!yearInited.value) {
        queryYear.value = Math.max(...years)
        yearInited.value = true
      } else if (firstYear.value != null && queryYear.value < firstYear.value) {
        queryYear.value = firstYear.value
      }
    }
    loadRecords()
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  let year = data?.year ?? queryYear.value
  if (firstYear.value != null && year < firstYear.value) {
    year = firstYear.value
  }
  queryYear.value = year
  loadRecords()
}

/** 重置按钮操作 */
function handleReset() {
  const years = allRecords.value.map(record => record.year)
  queryYear.value = years.length ? Math.max(...years) : new Date().getFullYear()
  loadRecords()
}

/** 查看详情 */
function handleDetail(item: PortalInsuranceRecord) {
  uni.navigateTo({ url: `/pages-hrm/portal/insurance/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(async () => {
  accessible.value = await checkHrmPortalAccess()
})
</script>
