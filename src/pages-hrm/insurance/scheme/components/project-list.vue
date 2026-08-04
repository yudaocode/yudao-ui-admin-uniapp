<template>
  <view>
    <view
      v-for="section in projectSections"
      :key="section.key"
      class="mt-24rpx"
    >
      <view class="mb-16rpx flex items-center justify-between px-24rpx">
        <view>
          <text class="text-30rpx text-[#333] font-semibold">{{ section.label }}</text>
          <text class="ml-16rpx text-24rpx text-[#999]">
            {{ section.projects.length ? `${section.projects.length} 项` : '--' }}
          </text>
        </view>
        <wd-button
          v-if="!disabled"
          size="small"
          type="primary"
          @click="openAddPopup(section.key)"
        >
          添加项目
        </wd-button>
      </view>

      <view
        v-if="!section.projects.length"
        class="mx-24rpx rounded-12rpx bg-white py-60rpx text-center text-28rpx text-[#999] shadow-sm"
      >
        暂无{{ section.label }}项目
      </view>

      <view
        v-for="(project, index) in section.projects"
        :key="project.id || `${section.key}-${project.type}-${index}`"
        class="mx-24rpx mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <view class="flex items-start justify-between gap-16rpx border-b border-[#f0f0f0] px-24rpx py-20rpx">
          <view class="min-w-0 flex-1">
            <wd-input
              v-if="isHrmInsuranceCustomProject(project.type) && !disabled"
              v-model="project.name"
              clearable
              placeholder="请输入项目名称"
              :maxlength="64"
            />
            <view v-else class="text-30rpx text-[#333] font-semibold">
              {{ formatHrmInsuranceProjectName(project) }}
            </view>
          </view>
          <wd-button
            v-if="!disabled"
            size="small"
            type="danger"
            variant="text"
            @click="removeProject(project)"
          >
            删除
          </wd-button>
        </view>

        <wd-cell-group border>
          <wd-cell title="默认基数" title-width="200rpx">
            <wd-input-number
              v-model="project.baseAmount"
              allow-null
              :min="0"
              :precision="2"
              :disabled="disabled"
            />
          </wd-cell>
          <template v-if="schemeType === HrmInsuranceSchemeType.PROPORTION">
            <wd-cell title="公司比例(%)" title-width="200rpx">
              <wd-input-number
                v-model="project.corporateRate"
                allow-null
                :min="0"
                :max="100"
                :precision="2"
                :disabled="disabled"
              />
            </wd-cell>
            <wd-cell title="个人比例(%)" title-width="200rpx">
              <wd-input-number
                v-model="project.personalRate"
                allow-null
                :min="0"
                :max="100"
                :precision="2"
                :disabled="disabled"
              />
            </wd-cell>
            <wd-cell
              title="公司金额"
              :value="formatHrmMoney(calculateHrmInsuranceProjectAmount(project, 'corporate'))"
            />
            <wd-cell
              title="个人金额"
              :value="formatHrmMoney(calculateHrmInsuranceProjectAmount(project, 'personal'))"
            />
          </template>
          <template v-else>
            <wd-cell title="公司金额" title-width="200rpx">
              <wd-input-number
                v-model="project.corporateAmount"
                allow-null
                :min="0"
                :precision="2"
                :disabled="disabled"
              />
            </wd-cell>
            <wd-cell title="个人金额" title-width="200rpx">
              <wd-input-number
                v-model="project.personalAmount"
                allow-null
                :min="0"
                :precision="2"
                :disabled="disabled"
              />
            </wd-cell>
          </template>
        </wd-cell-group>
      </view>

      <view
        v-if="section.projects.length"
        class="mx-24rpx mb-8rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
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

    <!-- 添加项目弹窗 -->
    <wd-popup
      v-model="addVisible"
      position="bottom"
      root-portal
      closable
      safe-area-inset-bottom
      @close="addVisible = false"
    >
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          添加{{ currentSection?.label }}项目
        </view>
        <wd-checkbox-group v-model="checkedTypes">
          <view
            v-for="option in currentSection?.options || []"
            :key="option.value"
            class="mb-16rpx"
          >
            <wd-checkbox :name="option.value" shape="square">
              {{ option.label }}
            </wd-checkbox>
          </view>
        </wd-checkbox-group>
        <view class="mt-24rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="addCustomProject">
            其他
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="confirmAddProjects">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { InsuranceSchemeProject } from '@/api/hrm/insurance/scheme'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { HrmInsuranceProjectType, HrmInsuranceSchemeType } from '@/pages-hrm/utils/constants'
import {
  calculateHrmInsuranceProjectAmount,
  formatHrmInsuranceProjectName,
  formatHrmMoney,
  isHrmInsuranceCustomProject,
  isHrmInsuranceProvidentFundProject,
  isHrmInsuranceSocialProject,
} from '@/pages-hrm/utils/format'
import { DICT_TYPE } from '@/utils/constants'

type ProjectSectionKey = 'social' | 'providentFund'

const props = withDefaults(defineProps<{
  modelValue: InsuranceSchemeProject[]
  schemeType?: number
  disabled?: boolean
}>(), {
  schemeType: HrmInsuranceSchemeType.PROPORTION,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: InsuranceSchemeProject[]]
}>()

const SOCIAL_PROJECT_TYPES = [ // 社保标准项目
  HrmInsuranceProjectType.ENDOWMENT,
  HrmInsuranceProjectType.MEDICAL,
  HrmInsuranceProjectType.UNEMPLOYMENT,
  HrmInsuranceProjectType.EMPLOYMENT_INJURY,
  HrmInsuranceProjectType.MATERNITY,
  HrmInsuranceProjectType.SUPPLEMENTARY_MEDICAL,
  HrmInsuranceProjectType.SUPPLEMENTARY_ENDOWMENT,
  HrmInsuranceProjectType.DISABILITY,
]
const PROVIDENT_FUND_PROJECT_TYPES = [HrmInsuranceProjectType.PROVIDENT_FUND] // 公积金标准项目

const toast = useToast()
const addVisible = ref(false) // 添加弹窗
const currentSectionKey = ref<ProjectSectionKey>('social') // 当前添加分区
const checkedTypes = ref<number[]>([]) // 勾选的标准项目

const projects = computed({
  get: () => props.modelValue || [],
  set: value => emit('update:modelValue', value),
})

const projectSections = computed(() => [ // 社保 / 公积金分区
  {
    key: 'social' as const,
    label: '社保',
    projects: projects.value.filter(item => isHrmInsuranceSocialProject(item.type)),
    options: getProjectOptions(SOCIAL_PROJECT_TYPES),
    customType: HrmInsuranceProjectType.CUSTOM_SOCIAL_SECURITY,
    corporateTotal: sumAmount(
      projects.value.filter(item => isHrmInsuranceSocialProject(item.type)),
      'corporate',
    ),
    personalTotal: sumAmount(
      projects.value.filter(item => isHrmInsuranceSocialProject(item.type)),
      'personal',
    ),
  },
  {
    key: 'providentFund' as const,
    label: '公积金',
    projects: projects.value.filter(item => isHrmInsuranceProvidentFundProject(item.type)),
    options: getProjectOptions(PROVIDENT_FUND_PROJECT_TYPES),
    customType: HrmInsuranceProjectType.CUSTOM_PROVIDENT_FUND,
    corporateTotal: sumAmount(
      projects.value.filter(item => isHrmInsuranceProvidentFundProject(item.type)),
      'corporate',
    ),
    personalTotal: sumAmount(
      projects.value.filter(item => isHrmInsuranceProvidentFundProject(item.type)),
      'personal',
    ),
  },
])

const currentSection = computed(() => { // 当前添加分区
  return projectSections.value.find(item => item.key === currentSectionKey.value)
})

/** 获得标准项目选项 */
function getProjectOptions(types: number[]) {
  return types.map(type => ({
    label: getDictLabel(DICT_TYPE.HRM_INSURANCE_PROJECT_TYPE, type) || String(type),
    value: type,
  }))
}

/** 合计金额 */
function sumAmount(list: InsuranceSchemeProject[], side: 'corporate' | 'personal') {
  return list.reduce((total, project) => {
    if (props.schemeType === HrmInsuranceSchemeType.PROPORTION) {
      return total + calculateHrmInsuranceProjectAmount(project, side)
    }
    return total + Number((side === 'corporate' ? project.corporateAmount : project.personalAmount) || 0)
  }, 0)
}

/** 创建参保项目 */
function createProject(type: number): InsuranceSchemeProject {
  return {
    type,
    name: isHrmInsuranceCustomProject(type)
      ? ''
      : (getDictLabel(DICT_TYPE.HRM_INSURANCE_PROJECT_TYPE, type) || ''),
    baseAmount: 0,
    corporateRate: 0,
    personalRate: 0,
    corporateAmount: 0,
    personalAmount: 0,
  }
}

/** 打开添加弹窗 */
function openAddPopup(key: ProjectSectionKey) {
  currentSectionKey.value = key
  const section = projectSections.value.find(item => item.key === key)
  checkedTypes.value = (section?.projects || [])
    .map(item => item.type)
    .filter((type): type is number => type != null && !isHrmInsuranceCustomProject(type))
  addVisible.value = true
}

/** 确认添加标准项目 */
function confirmAddProjects() {
  const section = currentSection.value
  if (!section) {
    return
  }
  const next = [...projects.value]
  // 移除当前分区中未勾选的标准项目
  for (let i = next.length - 1; i >= 0; i--) {
    const project = next[i]
    const inSection = section.key === 'social'
      ? isHrmInsuranceSocialProject(project.type)
      : isHrmInsuranceProvidentFundProject(project.type)
    if (!inSection || isHrmInsuranceCustomProject(project.type)) {
      continue
    }
    if (!checkedTypes.value.includes(project.type!)) {
      next.splice(i, 1)
    }
  }
  // 补充新勾选的标准项目
  for (const type of checkedTypes.value) {
    if (!next.some(item => item.type === type)) {
      next.push(createProject(type))
    }
  }
  projects.value = next
  addVisible.value = false
}

/** 添加自定义项目 */
function addCustomProject() {
  const section = currentSection.value
  if (!section) {
    return
  }
  projects.value = [...projects.value, createProject(section.customType)]
  addVisible.value = false
}

/** 删除项目 */
function removeProject(project: InsuranceSchemeProject) {
  projects.value = projects.value.filter(item => item !== project)
}

/** 校验参保项目 */
function validate() {
  if (!projects.value.some(item => isHrmInsuranceSocialProject(item.type))) {
    toast.warning('请至少添加一个社保项目')
    return false
  }
  if (projects.value.some(item => !item.name?.trim())) {
    toast.warning('参保项目名称不能为空')
    return false
  }
  return true
}
defineExpose({ validate })
</script>
