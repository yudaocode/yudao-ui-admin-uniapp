<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="record.title || '历史工资表详情'"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 工资表概览 -->
    <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-12rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
          {{ formatHrmYearMonth(record.year, record.month) }}
        </view>
        <view class="shrink-0 text-26rpx text-[#999]">
          计薪 {{ record.employeeCount ?? 0 }} 人
        </view>
      </view>
      <view class="grid grid-cols-2 gap-16rpx">
        <view class="rounded-8rpx bg-[#f6ffed] px-16rpx py-16rpx">
          <view class="text-24rpx text-[#999]">
            应发工资
          </view>
          <view class="mt-8rpx text-30rpx text-[#52c41a] font-semibold">
            {{ formatHrmMoney(record.expectedPaySalary) }}
          </view>
        </view>
        <view class="rounded-8rpx bg-[#e6f4ff] px-16rpx py-16rpx">
          <view class="text-24rpx text-[#999]">
            实发工资
          </view>
          <view class="mt-8rpx text-30rpx text-[#1677ff] font-semibold">
            {{ formatHrmMoney(record.realPaySalary) }}
          </view>
        </view>
      </view>
      <view class="mt-16rpx text-26rpx text-[#666]">
        个人社保：{{ formatHrmMoney(record.personalInsuranceAmount) }}
        <text class="mx-8rpx text-[#ddd]">|</text>
        个人公积金：{{ formatHrmMoney(record.personalProvidentFundAmount) }}
      </view>
      <view class="mt-8rpx text-26rpx text-[#666]">
        个人所得税：{{ formatHrmMoney(record.personalTax) }}
      </view>
      <view class="mt-8rpx text-26rpx text-[#666]">
        公司社保：{{ formatHrmMoney(record.corporateInsuranceAmount) }}
        <text class="mx-8rpx text-[#ddd]">|</text>
        公司公积金：{{ formatHrmMoney(record.corporateProvidentFundAmount) }}
      </view>
      <view class="mt-16rpx rounded-8rpx bg-[#e6f4ff] px-16rpx py-12rpx text-24rpx text-[#1677ff]">
        历史工资表已归档，仅可查询。
      </view>
    </view>

    <!-- 搜索组件 -->
    <view class="mt-16rpx">
      <SearchForm @search="handleQuery" @reset="handleReset" />
    </view>

    <!-- 员工工资列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无计薪员工"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleEmployeeDetail(item)"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.employeeName || '-' }}
            </view>
            <view class="shrink-0 text-28rpx text-[#1677ff] font-semibold">
              {{ formatHrmMoney(item.realPaySalary) }}
            </view>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">工号：</text>{{ item.jobNumber || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">部门：</text>{{ item.deptName || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">岗位：</text>{{ item.postName || '-' }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">应发：</text>{{ formatHrmMoney(item.expectedPaySalary) }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            <text class="mr-8rpx text-[#999]">个税：</text>{{ formatHrmMoney(item.personalTax) }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { SalaryMonthRecord } from '@/api/hrm/salary/month-record'
import type { SalaryMonthEmployeeRecord } from '@/api/hrm/salary/month-record/employee'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getSalaryMonthRecord } from '@/api/hrm/salary/month-record'
import { getSalaryMonthEmployeeRecordPage } from '@/api/hrm/salary/month-record/employee'
import { HrmSalaryMonthStatus } from '@/pages-hrm/utils/constants'
import { formatHrmMoney, formatHrmYearMonth } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import SearchForm from '../../month-record/components/search-form.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const record = ref<SalaryMonthRecord>({}) // 历史工资表
const list = ref<SalaryMonthEmployeeRecord[]>([]) // 员工列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({
  employeeName: undefined,
  jobNumber: undefined,
  deptId: undefined,
}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/salary/history/index')
}

/** 加载工资表详情 */
async function getDetail() {
  if (!props.id) {
    toast.warning('参数错误，历史工资表不能为空！')
    handleBack()
    return
  }
  const data = await getSalaryMonthRecord(Number(props.id))
  if (!data || data.status !== HrmSalaryMonthStatus.HISTORY) {
    toast.warning('历史工资表不存在')
    handleBack()
    return
  }
  record.value = data
  reload()
}

/** 查询员工工资列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!record.value.id) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getSalaryMonthEmployeeRecordPage({
      pageNo,
      pageSize,
      monthRecordId: record.value.id,
      ...queryParams.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    employeeName: data?.employeeName,
    jobNumber: data?.jobNumber,
    deptId: data?.deptId,
  }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看员工工资明细 */
function handleEmployeeDetail(item: SalaryMonthEmployeeRecord) {
  if (!item.monthRecordId || !item.employeeId) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/salary/month-record/employee/detail/index?monthRecordId=${item.monthRecordId}&employeeId=${item.employeeId}`,
  })
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
