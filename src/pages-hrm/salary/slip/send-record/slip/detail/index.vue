<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="工资条明细"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-48rpx">
      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-32rpx text-center shadow-sm">
        <view class="text-44rpx text-[#1677ff] font-semibold">
          {{ formatHrmMoney(formData.realPaySalary) }}
        </view>
        <view class="mt-8rpx text-26rpx text-[#999]">
          实发金额（元）
        </view>
        <view class="mt-16rpx text-28rpx text-[#666]">
          {{ formData.employeeName || '-' }}
          <text class="mx-8rpx text-[#ddd]">·</text>
          {{ formatHrmYearMonth(formData.year, formData.month) }}
        </view>
      </view>

      <view class="mt-24rpx">
        <wd-cell-group border>
          <wd-cell title="工号" :value="formData.jobNumber || '-'" />
          <wd-cell title="部门" :value="formData.deptName || '-'" />
          <wd-cell title="岗位" :value="formData.postName || '-'" />
          <wd-cell title="手机号" :value="formData.mobile || '-'" />
          <wd-cell title="查看状态">
            <dict-tag
              v-if="formData.readStatus != null"
              :type="DICT_TYPE.HRM_SALARY_SLIP_READ_STATUS"
              :value="formData.readStatus"
            />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="备注" :value="formData.remark || '-'" />
          <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
        </wd-cell-group>
      </view>

      <!-- 工资条项 -->
      <view class="mx-24rpx mt-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          工资条项目
        </view>
        <view
          v-for="option in displayOptions"
          :key="getOptionKey(option)"
          class="mb-16rpx rounded-12rpx bg-white px-24rpx py-20rpx shadow-sm"
          :class="option.children?.length ? 'bg-[#fafafa]' : ''"
        >
          <view class="flex items-center justify-between">
            <text
              class="min-w-0 flex-1 truncate text-28rpx"
              :class="option.children?.length ? 'text-[#999] font-semibold' : 'text-[#333]'"
            >
              {{ option.name || '-' }}
            </text>
            <text
              v-if="!option.children?.length"
              class="ml-16rpx shrink-0 text-28rpx text-[#333] font-semibold"
            >
              {{ formatHrmMoney(option.value) }}
            </text>
            <text v-else class="ml-16rpx shrink-0 text-28rpx text-[#999]">
              -
            </text>
          </view>
          <view
            v-for="child in option.children || []"
            :key="getOptionKey(child)"
            class="mt-16rpx flex items-center justify-between border-t border-[#f0f0f0] pt-16rpx"
          >
            <text class="min-w-0 flex-1 truncate pl-16rpx text-28rpx text-[#333]">
              {{ child.name || '-' }}
            </text>
            <text class="ml-16rpx shrink-0 text-28rpx text-[#333] font-semibold">
              {{ formatHrmMoney(child.value) }}
            </text>
          </view>
        </view>
        <view
          v-if="!displayOptions.length"
          class="rounded-12rpx bg-white p-48rpx text-center text-28rpx text-[#999]"
        >
          暂无工资项
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SalarySlip, SalarySlipOption } from '@/api/hrm/salary/slip'
import { onMounted, ref } from 'vue'
import { getSalarySlip } from '@/api/hrm/salary/slip'
import { formatHrmMoney, formatHrmYearMonth } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const formData = ref<SalarySlip>({}) // 工资条明细
const displayOptions = ref<SalarySlipOption[]>([]) // 展示用工资条项

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 工资条项行键 */
function getOptionKey(option: SalarySlipOption) {
  return option.code !== undefined ? `option-${option.code}` : `category-${option.sort ?? option.name}`
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getSalarySlip(Number(props.id))
  displayOptions.value = formData.value.options || []
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
