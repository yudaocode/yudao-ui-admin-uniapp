<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="调整参保方案"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell
            title="员工"
            :value="`${formData.employeeName || ''}${formData.jobNumber ? ` / ${formData.jobNumber}` : ''}` || '-'"
          />
          <SchemeFormPicker
            v-model="formData.schemeId"
            label="参保方案"
            prop="schemeId"
            placeholder="请选择参保方案"
            @change="handleSchemeChange"
          />
          <wd-cell title="状态">
            <dict-tag
              v-if="formData.status != null"
              :type="DICT_TYPE.HRM_INSURANCE_EMP_STATUS"
              :value="formData.status"
            />
            <text v-else>-</text>
          </wd-cell>
        </wd-cell-group>
      </wd-form>

      <view class="mx-24rpx mt-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          缴费项目
        </view>
        <view v-if="!projectList.length" class="rounded-12rpx bg-white p-48rpx text-center text-28rpx text-[#999]">
          请先选择参保方案
        </view>
        <view
          v-for="(item, index) in projectList"
          :key="item.schemeProjectId || index"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.name || '-' }}
            </view>
            <dict-tag
              v-if="item.type != null"
              :type="DICT_TYPE.HRM_INSURANCE_PROJECT_TYPE"
              :value="item.type"
            />
          </view>
          <view v-if="formData.schemeType === HrmInsuranceSchemeType.PROPORTION" class="flex flex-col gap-12rpx">
            <wd-cell title="缴纳基数" title-width="180rpx">
              <wd-input-number
                v-model="item.baseAmount"
                allow-null
                :precision="2"
                :min="0"
                :step="1"
              />
            </wd-cell>
            <view class="text-26rpx text-[#666]">
              公司比例：{{ formatHrmRate(item.corporateRate) }}
              <text class="mx-8rpx text-[#ddd]">|</text>
              个人比例：{{ formatHrmRate(item.personalRate) }}
            </view>
          </view>
          <view v-else class="flex flex-col gap-12rpx">
            <wd-cell title="公司金额" title-width="180rpx">
              <wd-input-number
                v-model="item.corporateAmount"
                allow-null
                :precision="2"
                :min="0"
                :step="1"
              />
            </wd-cell>
            <wd-cell title="个人金额" title-width="180rpx">
              <wd-input-number
                v-model="item.personalAmount"
                allow-null
                :precision="2"
                :min="0"
                :step="1"
              />
            </wd-cell>
          </view>
        </view>
      </view>
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
import type { InsuranceMonthEmployeeProject } from '@/api/hrm/insurance/month-record/employee'
import type { InsuranceScheme } from '@/api/hrm/insurance/scheme'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  getInsuranceMonthEmployeeRecord,
  updateInsuranceMonthEmployeeRecord,
} from '@/api/hrm/insurance/month-record/employee'
import { getInsuranceScheme } from '@/api/hrm/insurance/scheme'
import { createFormSchema } from '@/utils/wot'
import { HrmInsuranceSchemeType } from '@/pages-hrm/utils/constants'
import { formatHrmRate } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SchemeFormPicker from '../../components/scheme-form-picker.vue'

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
const formLoading = ref(false) // 表单提交状态
const formRef = ref<any>() // 表单引用
const projectList = ref<InsuranceMonthEmployeeProject[]>([]) // 参保项目列表
const formData = ref({
  id: undefined as number | undefined,
  employeeName: undefined as string | undefined,
  jobNumber: undefined as string | undefined,
  schemeId: undefined as number | undefined,
  schemeType: undefined as number | undefined,
  status: undefined as number | undefined,
}) // 表单数据

const formSchema = createFormSchema({
  schemeId: [{ required: true, message: '请选择社保方案' }],
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
  const detail = await getInsuranceMonthEmployeeRecord(Number(props.id))
  formData.value = {
    id: detail.id,
    employeeName: detail.employeeName,
    jobNumber: detail.jobNumber,
    schemeId: detail.schemeId,
    schemeType: detail.schemeType,
    status: detail.status,
  }
  projectList.value = [
    ...(detail.socialSecurityProjectList || []),
    ...(detail.providentFundProjectList || []),
  ].map(project => ({ ...project }))
}

/** 切换参保方案 */
async function handleSchemeChange(scheme?: InsuranceScheme) {
  if (!scheme?.id) {
    projectList.value = []
    return
  }
  const detail = await getInsuranceScheme(scheme.id)
  formData.value.schemeType = detail.type
  projectList.value = (detail.projectList || []).map(project => ({
    ...project,
    schemeProjectId: project.id,
  }))
}

/** 构建参保项目修改参数 */
function buildProjectUpdateList() {
  return projectList.value.map(project => ({
    schemeProjectId: project.schemeProjectId!,
    ...(formData.value.schemeType === HrmInsuranceSchemeType.PROPORTION
      ? { baseAmount: project.baseAmount }
      : {
          corporateAmount: project.corporateAmount,
          personalAmount: project.personalAmount,
        }),
  }))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !formData.value.id || !formData.value.schemeId) {
    return
  }
  formLoading.value = true
  try {
    await updateInsuranceMonthEmployeeRecord({
      id: formData.value.id,
      schemeId: formData.value.schemeId,
      projects: buildProjectUpdateList(),
    })
    toast.success('更新成功')
    uni.$emit('hrm:insurance:month-employee:reload')
    navigateBackPlus()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
