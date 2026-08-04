<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="员工月度社保详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-34rpx text-[#333] font-semibold">
            {{ formData.employeeName || '-' }}
          </view>
          <dict-tag
            v-if="formData.status != null"
            :type="DICT_TYPE.HRM_INSURANCE_EMP_STATUS"
            :value="formData.status"
          />
        </view>
        <view class="text-26rpx text-[#999]">
          {{ formData.postName || '-' }} · {{ formData.year || '-' }} 年 {{ formData.month || '-' }} 月
        </view>
      </view>

      <view class="mt-24rpx">
        <wd-cell-group border>
          <wd-cell title="性别">
            <dict-tag
              v-if="formData.sex != null"
              :type="DICT_TYPE.SYSTEM_USER_SEX"
              :value="formData.sex"
            />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="年龄" :value="formData.age != null ? String(formData.age) : '-'" />
          <wd-cell title="工号" :value="formData.jobNumber || '-'" />
          <wd-cell title="部门" :value="formData.deptName || '-'" />
          <wd-cell title="员工状态">
            <dict-tag
              v-if="formData.employeeStatus != null"
              :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
              :value="formData.employeeStatus"
            />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="入职日期" :value="formatHrmDate(formData.entryTime)" />
          <wd-cell title="参保城市" :value="formData.areaName || '-'" />
          <wd-cell title="身份证号" :value="formData.idNumber || '-'" />
          <wd-cell title="个人社保号" :value="formData.socialSecurityNumber || '-'" />
          <wd-cell title="个人公积金号" :value="formData.accumulationFundNumber || '-'" />
          <wd-cell title="参保方案" :value="formData.schemeName || '-'" />
        </wd-cell-group>
      </view>

      <!-- 缴费项目 -->
      <view class="mx-24rpx mt-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          缴费项目
        </view>
        <view
          v-for="(item, index) in projects"
          :key="item.schemeProjectId || index"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
            {{ formatHrmInsuranceProjectName(item) }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            缴纳基数：{{ formatHrmMoney(item.baseAmount) }}
          </view>
          <view
            v-if="formData.schemeType === HrmInsuranceSchemeType.PROPORTION"
            class="mb-8rpx text-26rpx text-[#666]"
          >
            企业比例：{{ formatHrmRate(item.corporateRate) }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            个人比例：{{ formatHrmRate(item.personalRate) }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            个人缴纳：{{ formatHrmMoney(item.personalAmount) }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            企业缴纳：{{ formatHrmMoney(item.corporateAmount) }}
          </view>
          <view class="text-26rpx text-[#666]">
            合计缴费：{{ formatHrmMoney(item.totalAmount) }}
          </view>
        </view>
        <view v-if="!projects.length" class="rounded-12rpx bg-white p-48rpx text-center text-28rpx text-[#999]">
          暂无缴费项目
        </view>
        <view v-else class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="text-28rpx text-[#333] font-semibold">
            缴费总价
          </view>
          <view class="mt-12rpx text-26rpx text-[#666]">
            个人：{{ formatHrmMoney(projectSummary.personalAmount) }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            企业：{{ formatHrmMoney(projectSummary.corporateAmount) }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            合计：{{ formatHrmMoney(projectSummary.totalAmount) }}
          </view>
        </view>
      </view>
    </view>

    <!-- 底部编辑 -->
    <view
      v-if="canEdit"
      class="yd-detail-footer"
    >
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="handleEdit">
          编辑
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { InsuranceMonthEmployeeRecord } from '@/api/hrm/insurance/month-record/employee'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getInsuranceMonthEmployeeRecord } from '@/api/hrm/insurance/month-record/employee'
import { useAccess } from '@/hooks/useAccess'
import { HrmInsuranceSchemeType } from '@/pages-hrm/utils/constants'
import {
  formatHrmDate,
  formatHrmInsuranceProjectName,
  formatHrmMoney,
  formatHrmRate,
} from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  id?: number | any
  editable?: number | string | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const formData = ref<InsuranceMonthEmployeeRecord>({ // 详情数据
  socialSecurityProjectList: [],
  providentFundProjectList: [],
})

const projects = computed(() => {
  return [
    ...(formData.value.socialSecurityProjectList || []),
    ...(formData.value.providentFundProjectList || []),
  ].map(project => ({
    ...project,
    totalAmount: Number(project.personalAmount || 0) + Number(project.corporateAmount || 0),
  }))
})

const projectSummary = computed(() => {
  return projects.value.reduce(
    (summary, project) => ({
      personalAmount: summary.personalAmount + Number(project.personalAmount || 0),
      corporateAmount: summary.corporateAmount + Number(project.corporateAmount || 0),
      totalAmount: summary.totalAmount + Number(project.totalAmount || 0),
    }),
    { personalAmount: 0, corporateAmount: 0, totalAmount: 0 },
  )
})

const canEdit = computed(() => // 未归档月表且有更新权限
  String(props.editable) === '1'
  && hasAccessByCodes(['hrm:insurance:month-record:update']),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getInsuranceMonthEmployeeRecord(Number(props.id))
}

/** 编辑参保方案 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/insurance/month-record/employee/form/index?id=${props.id}`,
  })
}

/** 初始化 / 返回刷新 */
onShow(() => {
  getDetail()
})
</script>
