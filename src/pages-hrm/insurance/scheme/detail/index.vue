<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="社保方案详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <wd-cell-group border title="基本信息">
        <wd-cell title="方案名称" :value="formData.name || '-'" />
        <wd-cell title="参保城市" :value="formData.areaName || '-'" />
        <wd-cell title="可选参保方案" :value="householdTypeLabel" />
        <wd-cell title="方案类型">
          <dict-tag
            v-if="formData.type != null"
            :type="DICT_TYPE.HRM_INSURANCE_SCHEME_TYPE"
            :value="formData.type"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="使用人数" :value="String(formData.useCount ?? 0)" />
        <wd-cell title="历史月记录" :value="String(formData.monthRecordCount ?? 0)" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>

      <!-- 缴费项目 -->
      <view
        v-for="section in projectSections"
        :key="section.key"
        class="mx-24rpx mt-24rpx"
      >
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          {{ section.label }}
        </view>
        <view
          v-for="(item, index) in section.projects"
          :key="item.id || `${section.key}-${index}`"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
            {{ formatHrmInsuranceProjectName(item) }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            默认基数：{{ formatHrmMoney(item.baseAmount) }}
          </view>
          <view
            v-if="formData.type === HrmInsuranceSchemeType.PROPORTION"
            class="mb-8rpx text-26rpx text-[#666]"
          >
            公司比例：{{ formatHrmRate(item.corporateRate) }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            个人比例：{{ formatHrmRate(item.personalRate) }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            公司金额：{{ formatHrmMoney(getProjectAmount(item, 'corporate')) }}
          </view>
          <view class="text-26rpx text-[#666]">
            个人金额：{{ formatHrmMoney(getProjectAmount(item, 'personal')) }}
          </view>
        </view>
        <view
          v-if="!section.projects.length"
          class="rounded-12rpx bg-white p-48rpx text-center text-28rpx text-[#999]"
        >
          暂无{{ section.label }}项目
        </view>
        <view v-else class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="text-28rpx text-[#333] font-semibold">
            {{ section.label }}合计
          </view>
          <view class="mt-12rpx text-26rpx text-[#666]">
            公司：{{ formatHrmMoney(section.corporateTotal) }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            个人：{{ formatHrmMoney(section.personalTotal) }}
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:insurance:scheme:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['hrm:insurance:scheme:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { InsuranceScheme, InsuranceSchemeProject } from '@/api/hrm/insurance/scheme'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteInsuranceScheme, getInsuranceScheme } from '@/api/hrm/insurance/scheme'
import { useAccess } from '@/hooks/useAccess'
import { HrmInsuranceSchemeType } from '@/pages-hrm/utils/constants'
import {
  calculateHrmInsuranceProjectAmount,
  formatHrmInsuranceProjectName,
  formatHrmMoney,
  formatHrmRate,
  isHrmInsuranceProvidentFundProject,
  isHrmInsuranceSocialProject,
} from '@/pages-hrm/utils/format'
import { delay, navigateBackPlus } from '@/utils'
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

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<InsuranceScheme>({ // 详情数据
  name: '',
})
const deleting = ref(false) // 删除中
const hasFooter = computed(() => { // 底部操作区
  return hasAccessByCodes([
    'hrm:insurance:scheme:update',
    'hrm:insurance:scheme:delete',
  ])
})
const householdTypeLabel = computed(() => { // 可选参保方案展示
  return formData.value.householdType || '-'
})
const projectSections = computed(() => { // 社保 / 公积金分区
  const projects = formData.value.projectList || []
  return [
    {
      key: 'social',
      label: '社保',
      projects: projects.filter(item => isHrmInsuranceSocialProject(item.type)),
      corporateTotal: sumProjectAmount(
        projects.filter(item => isHrmInsuranceSocialProject(item.type)),
        'corporate',
      ),
      personalTotal: sumProjectAmount(
        projects.filter(item => isHrmInsuranceSocialProject(item.type)),
        'personal',
      ),
    },
    {
      key: 'providentFund',
      label: '公积金',
      projects: projects.filter(item => isHrmInsuranceProvidentFundProject(item.type)),
      corporateTotal: sumProjectAmount(
        projects.filter(item => isHrmInsuranceProvidentFundProject(item.type)),
        'corporate',
      ),
      personalTotal: sumProjectAmount(
        projects.filter(item => isHrmInsuranceProvidentFundProject(item.type)),
        'personal',
      ),
    },
  ]
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/insurance/scheme/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getInsuranceScheme(Number(props.id))
}

/** 获得项目金额 */
function getProjectAmount(project: InsuranceSchemeProject, side: 'corporate' | 'personal') {
  if (formData.value.type === HrmInsuranceSchemeType.PROPORTION) {
    return calculateHrmInsuranceProjectAmount(project, side)
  }
  return side === 'corporate' ? project.corporateAmount : project.personalAmount
}

/** 合计项目金额 */
function sumProjectAmount(
  projects: InsuranceSchemeProject[],
  side: 'corporate' | 'personal',
) {
  return projects.reduce((total, project) => total + Number(getProjectAmount(project, side) || 0), 0)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/insurance/scheme/form/index?id=${props.id}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除社保方案「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteInsuranceScheme(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:insurance:scheme:reload')
    delay(handleBack)
  } catch {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:insurance:scheme:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:insurance:scheme:reload', getDetail)
})
</script>
