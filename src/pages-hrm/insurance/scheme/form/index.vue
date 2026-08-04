<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border title="基本信息">
          <wd-form-item title="方案名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入方案名称"
              :maxlength="64"
            />
          </wd-form-item>
          <yd-tree-select
            v-model="formData.areaId"
            :data="areaTree"
            label="参保城市"
            prop="areaId"
            label-width="200rpx"
            placeholder="请选择参保城市"
            @change="handleAreaChange"
          />
          <yd-form-picker
            v-model="formData.householdType"
            label="可选参保方案"
            label-width="200rpx"
            prop="householdType"
            :columns="householdTypeColumns"
            clearable
            placeholder="请选择参保方案"
            @confirm="handleHouseTypeChange"
            @clear="handleHouseTypeClear"
          />
          <wd-form-item title="方案类型" title-width="200rpx" prop="type" vertical>
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio :value="HrmInsuranceSchemeType.PROPORTION">
                设置参保基数和比例
              </wd-radio>
              <wd-radio :value="HrmInsuranceSchemeType.AMOUNT">
                仅设置参保金额
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
        </wd-cell-group>

        <view class="mx-24rpx mt-16rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-20rpx text-24rpx text-[#1677ff]">
          比例模式：公司或个人缴纳金额 = 参保基数 × 对应比例；金额模式直接填写公司和个人缴纳金额。
        </view>

        <ProjectList
          ref="projectListRef"
          v-model="formData.projectList"
          :scheme-type="formData.type"
        />
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { InsuranceScheme, InsuranceSchemeProject } from '@/api/hrm/insurance/scheme'
import type { InsuranceStandardType } from '@/api/hrm/insurance/standard'
import type { Area } from '@/api/system/area'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createInsuranceScheme,
  getInsuranceScheme,
  updateInsuranceScheme,
} from '@/api/hrm/insurance/scheme'
import {
  getInsuranceStandardProjectList,
  getInsuranceStandardTypeList,
} from '@/api/hrm/insurance/standard'
import { getAreaTree } from '@/api/system/area'
import { getDictLabel } from '@/hooks/useDict'
import { HrmInsuranceProjectType, HrmInsuranceSchemeType } from '@/pages-hrm/utils/constants'
import {
  isHrmInsuranceCustomProject,
} from '@/pages-hrm/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ProjectList from '../components/project-list.vue'

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
const dialog = useDialog()
const getTitle = computed(() => props.id ? '编辑社保方案' : '新增社保方案')
const formLoading = ref(false) // 表单提交状态
const standardLoading = ref(false) // 标准参保加载中
const formRef = ref<FormInstance>() // 表单组件引用
const projectListRef = ref<InstanceType<typeof ProjectList>>() // 项目列表
const areaTree = ref<Area[]>([]) // 地区树
const insuranceTypeList = ref<InsuranceStandardType[]>([]) // 标准参保方案
const formData = ref<InsuranceScheme>(createDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '方案名称不能为空' }],
  areaId: [{ required: true, message: '参保城市不能为空' }],
  type: [{ required: true, message: '方案类型不能为空' }],
})
const householdTypeColumns = computed(() => { // 可选参保方案
  return insuranceTypeList.value.map(item => ({
    label: item.name,
    value: item.code,
  }))
})

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

/** 创建默认表单数据 */
function createDefaultFormData(): InsuranceScheme {
  return {
    id: undefined,
    name: '',
    areaId: undefined,
    householdType: undefined,
    type: HrmInsuranceSchemeType.PROPORTION,
    projectList: [
      HrmInsuranceProjectType.ENDOWMENT,
      HrmInsuranceProjectType.MEDICAL,
      HrmInsuranceProjectType.UNEMPLOYMENT,
      HrmInsuranceProjectType.EMPLOYMENT_INJURY,
      HrmInsuranceProjectType.MATERNITY,
      HrmInsuranceProjectType.PROVIDENT_FUND,
    ].map(createProject),
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/insurance/scheme/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getInsuranceScheme(Number(props.id))
  if (formData.value.areaId) {
    await getInsuranceTypeList(formData.value.areaId)
  }
}

/** 查询标准参保方案 */
async function getInsuranceTypeList(areaId: number) {
  standardLoading.value = true
  try {
    const data = await getInsuranceStandardTypeList(areaId)
    if (formData.value.areaId !== areaId) {
      return
    }
    insuranceTypeList.value = data
    const selectedType = data.find(
      item => item.name === formData.value.householdType && item.code !== formData.value.householdType,
    )
    if (selectedType) {
      formData.value.householdType = selectedType.code
    }
  } finally {
    standardLoading.value = false
  }
}

/** 清空标准参保项目金额 */
function resetStandardProjectValues() {
  formData.value.projectList?.forEach((project) => {
    if (isHrmInsuranceCustomProject(project.type)) {
      return
    }
    project.baseAmount = 0
    project.corporateRate = 0
    project.personalRate = 0
    project.corporateAmount = 0
    project.personalAmount = 0
  })
}

/** 切换参保城市 */
async function handleAreaChange(areaId?: number | string) {
  const nextAreaId = areaId == null || areaId === '' ? undefined : Number(areaId)
  formData.value.householdType = undefined
  insuranceTypeList.value = []
  resetStandardProjectValues()
  if (nextAreaId) {
    await getInsuranceTypeList(nextAreaId)
  }
}

/** 清空标准参保方案 */
function handleHouseTypeClear() {
  formData.value.householdType = undefined
}

/** 切换标准参保方案 */
async function handleHouseTypeChange(typeCode?: string) {
  const areaId = formData.value.areaId
  if (!areaId || !typeCode) {
    return
  }
  standardLoading.value = true
  try {
    const projects = await getInsuranceStandardProjectList({
      areaId,
      typeCode,
    })
    if (formData.value.areaId !== areaId || formData.value.householdType !== typeCode) {
      return
    }
    const customProjects = (formData.value.projectList || [])
      .filter(project => isHrmInsuranceCustomProject(project.type))
    formData.value.projectList = [
      ...projects.map(project => ({
        ...project,
        id: undefined,
        schemeId: undefined,
        name: getDictLabel(DICT_TYPE.HRM_INSURANCE_PROJECT_TYPE, project.type) || project.name,
      })),
      ...customProjects,
    ]
  } finally {
    standardLoading.value = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!projectListRef.value?.validate()) {
    return
  }

  if (props.id) {
    try {
      await dialog.confirm({
        title: '提示',
        msg: '编辑参保方案后，不会变更现有参保信息，确定提交吗？',
      })
    } catch {
      return
    }
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateInsuranceScheme(formData.value)
      toast.success('修改成功')
    } else {
      await createInsuranceScheme(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('hrm:insurance:scheme:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  areaTree.value = await getAreaTree()
  await getDetail()
})
</script>
