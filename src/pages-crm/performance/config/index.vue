<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="业绩目标设置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 目标列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无业绩目标设置"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.objectName || '未命名对象' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                {{ item.year }} 年 · {{ getBizTypeLabel(item.bizType) }} · {{ getObjectTypeLabel(item.objectType) }}
              </view>
            </view>
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">年度目标：</text>{{ formatMoney(item.yearTargetPrice) }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['crm:performance-config:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { PerformanceConfig } from '@/api/crm/performance/config'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import {
  getPerformanceConfigPage,
  PerformanceConfigObjectTypeEnum,
} from '@/api/crm/performance/config'
import { BizTypeEnum } from '@/api/crm/permission'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatMoney } from '@/utils/format'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const now = new Date()
const list = ref<PerformanceConfig[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>(getDefaultQueryParams()) // 查询参数

const bizTypeColumns = [
  { label: '销售目标', value: BizTypeEnum.CRM_CONTRACT },
  { label: '回款目标', value: BizTypeEnum.CRM_RECEIVABLE },
] // 目标类型选项
const objectTypeColumns = [
  { label: '部门', value: PerformanceConfigObjectTypeEnum.DEPT },
  { label: '员工', value: PerformanceConfigObjectTypeEnum.USER },
] // 对象类型选项

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 默认查询参数 */
function getDefaultQueryParams() {
  return { year: now.getFullYear() }
}

/** 查询目标列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPerformanceConfigPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...getDefaultQueryParams(), ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = getDefaultQueryParams()
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增目标 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-crm/performance/config/form/index' })
}

/** 查看详情 */
function handleDetail(item: PerformanceConfig) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-crm/performance/config/detail/index?id=${item.id}` })
}

/** 获取目标类型名称 */
function getBizTypeLabel(value?: number) {
  return bizTypeColumns.find(item => item.value === value)?.label || ''
}

/** 获取对象类型名称 */
function getObjectTypeLabel(value?: number) {
  return objectTypeColumns.find(item => item.value === value)?.label || ''
}

/** 初始化 */
onMounted(() => {
  uni.$on('crm:performance-config:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:performance-config:reload', reload)
})
</script>
