<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="薪资档案详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 头部摘要 -->
    <view v-if="employee.id" class="bg-white px-24rpx py-24rpx">
      <view class="mb-16rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-36rpx text-[#333] font-semibold">
          {{ employee.name || '-' }}
        </view>
        <view class="flex shrink-0 flex-col items-end gap-8rpx">
          <dict-tag
            v-if="employee.entryStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
            :value="employee.entryStatus"
          />
          <dict-tag
            v-if="employee.status != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="employee.status"
          />
        </view>
      </view>
      <view class="text-26rpx text-[#666]">
        {{ employee.deptName || '-' }} · {{ employee.postName || '-' }}
      </view>
      <view class="mt-8rpx text-26rpx text-[#666]">
        工号：{{ employee.jobNumber || '-' }} · 手机：{{ employee.mobile || '-' }}
      </view>
    </view>

    <!-- 详情分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 薪资档案 -->
    <view v-if="activeTab === 'salary'" class="pb-160rpx">
      <template v-if="salaryEmployee.id">
        <wd-cell-group border title="当前薪资">
          <wd-cell title="正式工资" :value="formatHrmMoney(salaryEmployee.regularSalary)" />
          <wd-cell title="试用期工资" :value="formatHrmMoney(salaryEmployee.probationSalary)" />
          <wd-cell title="生效日期" :value="formatHrmDate(salaryEmployee.effectTime)" />
          <wd-cell title="调整原因">
            <dict-tag
              v-if="salaryEmployee.changeReason != null"
              :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
              :value="salaryEmployee.changeReason"
            />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="档案状态">
            <dict-tag
              v-if="salaryEmployee.changeType != null"
              :type="DICT_TYPE.HRM_SALARY_CHANGE_TYPE"
              :value="salaryEmployee.changeType"
            />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="备注" :value="salaryEmployee.remark || '-'" />
        </wd-cell-group>

        <view class="mt-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
          正式工资明细
        </view>
        <view class="p-24rpx">
          <view
            v-for="item in salaryEmployee.salaryOptions || []"
            :key="`regular-${item.code}`"
            class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-8rpx flex items-center justify-between gap-16rpx">
              <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">
                {{ item.name || '-' }}
              </text>
              <text class="shrink-0 text-28rpx text-[#333] font-medium">
                {{ formatHrmMoney(item.value) }}
              </text>
            </view>
            <view class="text-24rpx text-[#999]">
              编码：{{ item.code ?? '-' }}
            </view>
          </view>
          <view
            v-if="!(salaryEmployee.salaryOptions || []).length"
            class="py-40rpx text-center text-28rpx text-[#999]"
          >
            暂无正式工资明细
          </view>
        </view>

        <view class="px-24rpx text-28rpx text-[#333] font-semibold">
          试用期工资明细
        </view>
        <view class="p-24rpx">
          <view
            v-for="item in salaryEmployee.probationSalaryOptions || []"
            :key="`probation-${item.code}`"
            class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-8rpx flex items-center justify-between gap-16rpx">
              <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">
                {{ item.name || '-' }}
              </text>
              <text class="shrink-0 text-28rpx text-[#333] font-medium">
                {{ formatHrmMoney(item.value) }}
              </text>
            </view>
            <view class="text-24rpx text-[#999]">
              编码：{{ item.code ?? '-' }}
            </view>
          </view>
          <view
            v-if="!(salaryEmployee.probationSalaryOptions || []).length"
            class="py-40rpx text-center text-28rpx text-[#999]"
          >
            暂无试用期工资明细
          </view>
        </view>
      </template>
      <view v-else class="py-80rpx text-center text-28rpx text-[#999]">
        该员工尚未定薪
      </view>
    </view>

    <!-- 调薪记录 -->
    <ChangeRecordList
      v-else-if="activeTab === 'records'"
      ref="changeRecordListRef"
      :employee-id="Number(props.id)"
      @change="getDetail"
      @edit="openSetSalary"
    />

    <!-- 底部操作 -->
    <view
      v-if="hasAccessByCodes(['hrm:salary:employee-info:update']) && employee.id"
      class="yd-detail-footer"
    >
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="openSetSalary()">
          {{ salaryEmployee.id ? '调薪' : '定薪' }}
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Employee } from '@/api/hrm/employee'
import type { SalaryChangeRecord } from '@/api/hrm/salary/change-record'
import type { SalaryEmployeeInfo } from '@/api/hrm/salary/employee-info'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getEmployee } from '@/api/hrm/employee'
import { getSalaryEmployeeInfo } from '@/api/hrm/salary/employee-info'
import { useAccess } from '@/hooks/useAccess'
import { formatHrmDate, formatHrmMoney } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ChangeRecordList from '../components/change-record-list.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const employee = ref<Employee>({} as Employee) // 员工档案
const salaryEmployee = ref<SalaryEmployeeInfo>({}) // 薪资档案
const tabIndex = ref(0) // 当前页签
const changeRecordListRef = ref<InstanceType<typeof ChangeRecordList>>() // 调薪记录
const tabs = [ // tab 配置
  { key: 'salary', title: '薪资档案' },
  { key: 'records', title: '调薪记录' },
]

const activeTab = computed(() => tabs[tabIndex.value]?.key || 'salary')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const [employeeData, salaryEmployeeData] = await Promise.all([
    getEmployee(Number(props.id)),
    getSalaryEmployeeInfo(Number(props.id)),
  ])
  employee.value = employeeData
  salaryEmployee.value = salaryEmployeeData || {}
}

/** 打开定薪/调薪表单 */
function openSetSalary(record?: SalaryChangeRecord) {
  if (!props.id) {
    return
  }
  const query = [
    `employeeId=${props.id}`,
    record?.id ? `recordId=${record.id}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({
    url: `/pages-hrm/salary/employee-info/form/index?${query}`,
  })
}

/** 初始化 */
onShow(async () => {
  await getDetail()
  await changeRecordListRef.value?.getList()
})
</script>
