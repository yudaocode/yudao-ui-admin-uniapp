<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="员工工资明细"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-12rpx truncate text-34rpx text-[#333] font-semibold">
          {{ formData.employeeName || '-' }}
        </view>
        <view class="text-26rpx text-[#999]">
          {{ formData.postName || '-' }} · {{ formData.year || '-' }} 年 {{ formData.month || '-' }} 月
        </view>
      </view>

      <view class="mt-24rpx">
        <wd-cell-group border>
          <wd-cell title="工号" :value="formData.jobNumber || '-'" />
          <wd-cell title="部门" :value="formData.deptName || '-'" />
          <wd-cell title="计薪天数" :value="formatHrmDays(formData.needWorkDay)" />
          <wd-cell title="实际计薪天数" :value="formatHrmDays(formData.actualWorkDay)" />
          <wd-cell title="绩效系数" :value="formData.performanceCoefficient != null ? String(formData.performanceCoefficient) : '-'" />
          <wd-cell title="应发工资" :value="formatHrmMoney(formData.expectedPaySalary)" />
          <wd-cell title="应税工资" :value="formatHrmMoney(formData.taxableSalary)" />
          <wd-cell title="个人所得税" :value="formatHrmMoney(formData.personalTax)" />
          <wd-cell title="实发工资" :value="formatHrmMoney(formData.realPaySalary)" />
        </wd-cell-group>
      </view>

      <!-- 工资项 -->
      <view class="mx-24rpx mt-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          工资项明细
        </view>
        <view
          v-for="option in displayOptions"
          :key="option.code"
          class="mb-16rpx flex items-center justify-between rounded-12rpx bg-white px-24rpx py-20rpx shadow-sm"
        >
          <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">
            {{ option.name || `编码 ${option.code}` }}
          </text>
          <text class="ml-16rpx shrink-0 text-28rpx text-[#333] font-semibold">
            {{ formatHrmMoney(option.value) }}
          </text>
        </view>
        <view v-if="!displayOptions.length" class="rounded-12rpx bg-white p-48rpx text-center text-28rpx text-[#999]">
          暂无工资项
        </view>
      </view>
    </view>

    <!-- 底部编辑 -->
    <view v-if="canEdit" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="handleEdit">
          编辑
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SalaryOptionValue } from '@/api/hrm/salary/config/option'
import type { SalaryMonthEmployeeRecord } from '@/api/hrm/salary/month-record/employee'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getSalaryMonthRecord } from '@/api/hrm/salary/month-record'
import { getSalaryMonthEmployeeRecordList } from '@/api/hrm/salary/month-record/employee'
import { useAccess } from '@/hooks/useAccess'
import { HrmSalaryMonthStatus } from '@/pages-hrm/utils/constants'
import { formatHrmDays, formatHrmMoney, getSalaryLeafOptions } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{
  monthRecordId?: number | any
  employeeId?: number | any
  writable?: number | string | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const formData = ref<SalaryMonthEmployeeRecord>({}) // 员工工资
const optionNameMap = ref<Record<number, string>>({}) // 薪资项名称
const monthWritable = ref(false) // 月表是否可写

const canEdit = computed(() => { // 是否可编辑
  return monthWritable.value
    && props.writable
    && hasAccessByCodes(['hrm:salary:month-record:update'])
})

const displayOptions = computed(() => { // 工资项展示列表
  const values = formData.value.optionValues || []
  return values.map((item: SalaryOptionValue) => ({
    code: item.code,
    name: item.name || (item.code != null ? optionNameMap.value[item.code] : undefined),
    value: item.value,
  }))
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载详情 */
async function getDetail() {
  if (!props.monthRecordId || !props.employeeId) {
    return
  }
  const [monthRecord, list] = await Promise.all([
    getSalaryMonthRecord(Number(props.monthRecordId)),
    getSalaryMonthEmployeeRecordList({
      monthRecordId: Number(props.monthRecordId),
      employeeId: Number(props.employeeId),
    }),
  ])
  monthWritable.value = monthRecord.status !== HrmSalaryMonthStatus.HISTORY
  optionNameMap.value = Object.fromEntries(
    getSalaryLeafOptions(monthRecord.optionHeaders)
      .filter(option => option.code != null)
      .map(option => [option.code, option.name]),
  )
  formData.value = list[0] || {}
}

/** 编辑 */
function handleEdit() {
  if (!props.monthRecordId || !props.employeeId) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/salary/month-record/employee/form/index?monthRecordId=${props.monthRecordId}&employeeId=${props.employeeId}`,
  })
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
