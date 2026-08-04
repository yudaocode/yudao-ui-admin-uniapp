<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="navbarTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <view v-if="loading && !formData.id" class="py-64rpx text-center text-26rpx text-[#999]">
        <wd-loading size="32rpx" />
        <view class="mt-12rpx">
          正在加载社保详情
        </view>
      </view>

      <view v-else class="pb-40rpx">
        <!-- 摘要 -->
        <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-12rpx text-34rpx text-[#333] font-semibold">
            {{ formatHrmYearMonth(formData.year, formData.month) }} 社保表
          </view>
          <view class="text-26rpx text-[#999]">
            {{ formData.schemeName || '-' }}
            <text v-if="formData.schemeCity">
              · {{ formData.schemeCity }}
            </text>
          </view>
        </view>

        <!-- 基本信息 -->
        <view class="mt-24rpx">
          <wd-cell-group border>
            <wd-cell title="参保方案" :value="formData.schemeName || '-'" />
            <wd-cell title="方案类型">
              <dict-tag
                v-if="formData.schemeType != null"
                :type="DICT_TYPE.HRM_INSURANCE_SCHEME_TYPE"
                :value="formData.schemeType"
              />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="个人缴纳" :value="formatHrmMoney(personalTotal)" />
            <wd-cell title="公司缴纳" :value="formatHrmMoney(corporateTotal)" />
            <wd-cell title="本月合计">
              <text class="text-[#1677ff] font-semibold">
                {{ formatHrmMoney(personalTotal + corporateTotal) }}
              </text>
            </wd-cell>
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
              {{ item.name || '-' }}
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              缴纳基数：{{ formatHrmMoney(item.baseAmount) }}
            </view>
            <view
              v-if="formData.schemeType === HrmInsuranceSchemeType.PROPORTION"
              class="mb-8rpx text-26rpx text-[#666]"
            >
              个人比例：{{ formatHrmRate(item.personalRate) }}
              <text class="mx-8rpx text-[#ddd]">|</text>
              公司比例：{{ formatHrmRate(item.corporateRate) }}
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              个人金额：{{ formatHrmMoney(item.personalAmount) }}
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              公司金额：{{ formatHrmMoney(item.corporateAmount) }}
            </view>
            <view class="text-26rpx text-[#666]">
              合计：{{ formatHrmMoney((item.personalAmount || 0) + (item.corporateAmount || 0)) }}
            </view>
          </view>
          <view v-if="!projects.length" class="rounded-12rpx bg-white p-48rpx text-center text-28rpx text-[#999]">
            暂无缴费项目
          </view>
          <view v-else class="rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="text-28rpx text-[#333] font-semibold">
              缴费合计
            </view>
            <view class="mt-12rpx text-26rpx text-[#666]">
              个人：{{ formatHrmMoney(projectSummary.personalAmount) }}
              <text class="mx-8rpx text-[#ddd]">|</text>
              公司：{{ formatHrmMoney(projectSummary.corporateAmount) }}
              <text class="mx-8rpx text-[#ddd]">|</text>
              合计：{{ formatHrmMoney(projectSummary.totalAmount) }}
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { PortalInsuranceRecord } from '@/api/hrm/portal/insurance/record'
import { computed, onMounted, ref } from 'vue'
import { getPortalInsuranceRecord } from '@/api/hrm/portal/insurance/record'
import { HrmInsuranceSchemeType } from '@/pages-hrm/utils/constants'
import {
  formatHrmMoney,
  formatHrmRate,
  formatHrmYearMonth,
} from '@/pages-hrm/utils/format'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const formData = ref<PortalInsuranceRecord>({ // 详情数据
  id: 0,
  employeeId: 0,
  year: 0,
  month: 0,
  projects: [],
})

const navbarTitle = computed(() => { // 导航标题
  if (!formData.value.month) {
    return '社保详情'
  }
  return `${formData.value.month} 月社保表`
})

const personalTotal = computed(() => // 个人缴纳合计
  (formData.value.personalInsuranceAmount || 0) + (formData.value.personalProvidentFundAmount || 0),
)

const corporateTotal = computed(() => // 公司缴纳合计
  (formData.value.corporateInsuranceAmount || 0) + (formData.value.corporateProvidentFundAmount || 0),
)

const projects = computed(() => formData.value.projects || [])

const projectSummary = computed(() => {
  return projects.value.reduce(
    (summary, project) => ({
      personalAmount: summary.personalAmount + Number(project.personalAmount || 0),
      corporateAmount: summary.corporateAmount + Number(project.corporateAmount || 0),
      totalAmount:
        summary.totalAmount
        + Number(project.personalAmount || 0)
        + Number(project.corporateAmount || 0),
    }),
    { personalAmount: 0, corporateAmount: 0, totalAmount: 0 },
  )
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  loading.value = true
  try {
    formData.value = await getPortalInsuranceRecord(Number(props.id))
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  accessible.value = await checkHrmPortalAccess()
  if (!accessible.value) {
    return
  }
  await getDetail()
})
</script>
