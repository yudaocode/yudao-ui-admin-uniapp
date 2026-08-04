<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="在线编辑工资"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 说明 -->
    <view class="mx-24rpx mt-16rpx rounded-8rpx bg-[#e6f4ff] px-16rpx py-12rpx text-24rpx text-[#1677ff]">
      仅可编辑非系统计算项。点击员工进入编辑，保存后返回本页。
    </view>

    <!-- 员工列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="20"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-enabled="false"
      empty-view-text="暂无可编辑员工"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleEdit(item)"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.employeeName || '-' }}
            </view>
            <text class="shrink-0 text-28rpx text-[#1677ff]">
              编辑
            </text>
          </view>
          <view class="mb-8rpx text-28rpx text-[#666]">
            工号：{{ item.jobNumber || '-' }}
          </view>
          <view class="mb-8rpx text-28rpx text-[#666]">
            部门：{{ item.deptName || '-' }}
          </view>
          <view class="text-28rpx text-[#666]">
            实发：{{ formatHrmMoney(item.realPaySalary) }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { SalaryMonthEmployeeRecord } from '@/api/hrm/salary/month-record/employee'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getSalaryMonthEmployeeRecordList } from '@/api/hrm/salary/month-record/employee'
import { HrmSalaryEmployeeChangeType } from '@/pages-hrm/utils/constants'
import { formatHrmMoney } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{
  monthRecordId?: number | any
  employeeChangeType?: number | any
  employeeName?: string
  jobNumber?: string
  deptId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<SalaryMonthEmployeeRecord[]>([]) // 员工列表
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询可编辑员工列表 */
async function queryList() {
  if (!props.monthRecordId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getSalaryMonthEmployeeRecordList({
      monthRecordId: Number(props.monthRecordId),
      employeeChangeType: props.employeeChangeType != null
        ? Number(props.employeeChangeType)
        : HrmSalaryEmployeeChangeType.ALL,
      employeeName: props.employeeName || undefined,
      jobNumber: props.jobNumber || undefined,
      deptId: props.deptId != null && props.deptId !== '' ? Number(props.deptId) : undefined,
    })
    list.value = data
    pagingRef.value?.completeByTotal(data, data.length)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 编辑员工工资 */
function handleEdit(item: SalaryMonthEmployeeRecord) {
  if (!item.monthRecordId || !item.employeeId) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/salary/month-record/employee/form/index?monthRecordId=${item.monthRecordId}&employeeId=${item.employeeId}`,
  })
}

/** 返回后刷新 */
onShow(() => {
  pagingRef.value?.reload()
})
</script>
