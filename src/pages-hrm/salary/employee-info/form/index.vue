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
        <wd-cell-group border>
          <EmployeeFormPicker
            v-model="formData.employeeId"
            label="员工"
            prop="employeeId"
            placeholder="请选择员工"
            :disabled="!!formData.id || !!props.employeeId"
            @confirm="handleEmployeeConfirm"
          />
          <wd-cell title="记录类型">
            <text>{{ formData.recordType === HrmSalaryRecordType.CHANGE ? '调薪' : '定薪' }}</text>
          </wd-cell>
          <yd-form-picker
            v-model="selectedTemplateId"
            label="调薪模板"
            label-width="180rpx"
            :columns="templateColumns"
            placeholder="请选择调薪模板"
            @confirm="handleTemplateConfirm"
          />
          <template v-if="formData.recordType === HrmSalaryRecordType.CHANGE">
            <wd-form-item title="生效日期" title-width="180rpx" prop="effectTime" center>
              <view class="w-full" @click="effectTimeVisible = true">
                <wd-input
                  :model-value="formatDate(formData.effectTime) || ''"
                  readonly
                  align-right
                  placeholder="请选择生效日期"
                />
              </view>
            </wd-form-item>
            <wd-datetime-picker
              v-if="effectTimeVisible"
              v-model="formData.effectTime"
              v-model:visible="effectTimeVisible"
              type="date"
              title="生效日期"
            />
            <yd-form-picker
              v-model="formData.changeReason"
              label="调整原因"
              label-width="180rpx"
              prop="changeReason"
              :dict-type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
              placeholder="请选择调整原因"
            />
            <wd-cell title="调整前正式" :value="formatHrmMoney(beforeTotal)" />
            <wd-cell title="调整前试用" :value="formatHrmMoney(probationBeforeTotal)" />
          </template>
          <wd-form-item title="备注" title-width="180rpx" prop="remark" vertical>
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
              :maxlength="500"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <view
        v-if="isPendingChange"
        class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] px-24rpx py-20rpx text-26rpx text-[#d48806]"
      >
        该调整将在生效日期前保持待生效，当前薪资档案不会提前变化
      </view>

      <view class="mx-24rpx mt-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          薪资明细
        </view>
        <view
          v-for="row in salaryOptionRows"
          :key="row.code"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-8rpx text-28rpx text-[#333] font-medium">
            {{ row.name || '-' }}
          </view>
          <view class="mb-16rpx text-24rpx text-[#999]">
            编码：{{ row.code ?? '-' }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            试用期工资
          </view>
          <wd-input-number
            v-model="row.probationOption.value"
            allow-null
            :precision="2"
            :min="0"
            :max="100000000"
          />
          <view class="mb-8rpx mt-16rpx text-26rpx text-[#666]">
            转正后工资
          </view>
          <wd-input-number
            v-model="row.regularOption.value"
            allow-null
            :precision="2"
            :min="0"
            :max="100000000"
          />
        </view>
        <view v-if="!salaryOptionRows.length" class="rounded-12rpx bg-white p-48rpx text-center text-28rpx text-[#999]">
          暂无薪资项，请先选择调薪模板
        </view>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { SalaryOption, SalaryOptionValue } from '@/api/hrm/salary/config/option'
import type { SalaryChangeTemplate } from '@/api/hrm/salary/config/change-template'
import type { SalaryEmployeeInfoUpdateReq } from '@/api/hrm/salary/employee-info'
import dayjs from 'dayjs'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getSalaryChangeRecord } from '@/api/hrm/salary/change-record'
import { getSalaryChangeTemplateList } from '@/api/hrm/salary/config/change-template'
import { getSalaryOptionSimpleList } from '@/api/hrm/salary/config/option'
import {
  getSalaryAdjustmentMinEffectDate,
  getSalaryEmployeeInfo,
  updateSalaryEmployeeInfo,
} from '@/api/hrm/salary/employee-info'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'
import {
  HrmSalaryChangeReason,
  HrmSalaryOptionCategoryCode,
  HrmSalaryRecordType,
} from '@/pages-hrm/utils/constants'
import { formatHrmMoney } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  employeeId?: number | any
  recordId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单引用
const formLoading = ref(false) // 表单提交状态
const salaryOptionList = ref<SalaryOption[]>([]) // 薪资项列表
const salaryTemplateList = ref<SalaryChangeTemplate[]>([]) // 调薪模板列表
const selectedTemplateId = ref<number>() // 已选调薪模板
const minEffectDate = ref<string>() // 最早调薪生效日期
const beforeTotal = ref(0) // 调整前正式工资
const probationBeforeTotal = ref(0) // 调整前试用期工资
const effectTimeVisible = ref(false) // 生效日期选择器显隐
let salaryDraftMap = new Map<number, SalaryOptionValue>() // 正式工资草稿
let probationDraftMap = new Map<number, SalaryOptionValue>() // 试用期工资草稿

const formData = ref<SalaryEmployeeInfoUpdateReq>(createDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  employeeId: [{ required: true, message: '员工不能为空' }],
  changeReason: [{
    required: () => formData.value.recordType === HrmSalaryRecordType.CHANGE,
    message: '调整原因不能为空',
  }],
  effectTime: [{
    required: () => formData.value.recordType === HrmSalaryRecordType.CHANGE,
    message: '生效日期不能为空',
  }],
})

const getTitle = computed(() => { // 页面标题
  if (props.recordId) {
    return '编辑定薪调薪记录'
  }
  return formData.value.recordType === HrmSalaryRecordType.CHANGE ? '调薪' : '定薪'
})

const templateColumns = computed(() => // 调薪模板选项
  salaryTemplateList.value.map(item => ({
    value: item.id,
    label: item.name,
  })),
)

const salaryOptionRows = computed(() => { // 薪资项表格行
  const regularOptions = formData.value.salaryOptions || []
  const probationOptions = formData.value.probationSalaryOptions || []
  const regularOptionMap = new Map(regularOptions.map(option => [option.code, option]))
  const probationOptionMap = new Map(probationOptions.map(option => [option.code, option]))
  const optionCodes = Array.from(new Set([
    ...regularOptions.map(option => option.code),
    ...probationOptions.map(option => option.code),
  ].filter((code): code is number => code !== undefined)))
  return optionCodes.map(code => ({
    code,
    name: regularOptionMap.get(code)?.name || probationOptionMap.get(code)?.name,
    regularOption: regularOptionMap.get(code) || { code, value: 0 },
    probationOption: probationOptionMap.get(code) || { code, value: 0 },
  }))
})

const isPendingChange = computed(() => { // 是否为待生效调薪
  return formData.value.recordType === HrmSalaryRecordType.CHANGE
    && !!formData.value.effectTime
    && dayjs(formData.value.effectTime).isAfter(dayjs(), 'day')
})

/** 创建表单默认值 */
function createDefaultFormData(): SalaryEmployeeInfoUpdateReq {
  return {
    employeeId: undefined,
    recordType: HrmSalaryRecordType.FIXED,
    changeReason: HrmSalaryChangeReason.ENTRY_SALARY,
    effectTime: dayjs().startOf('month').valueOf(),
    remark: '',
    salaryOptions: [],
    probationSalaryOptions: [],
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 员工确认选择 */
async function handleEmployeeConfirm() {
  await loadSalaryEmployee()
}

/** 应用调薪模板 */
function handleTemplateConfirm() {
  applySelectedTemplate(true)
}

/** 构建默认薪资项 */
function buildDefaultOptionValues() {
  return salaryOptionList.value.map(item => ({
    code: item.code,
    name: item.name,
    value: 0,
  }))
}

/** 选中默认调薪模板 */
function selectDefaultTemplate() {
  selectedTemplateId.value = salaryTemplateList.value.find(item => item.defaultStatus)?.id
}

/** 重置薪资项草稿 */
function resetDraftMaps(
  salaryOptions: SalaryOptionValue[] = [],
  probationSalaryOptions: SalaryOptionValue[] = [],
) {
  salaryDraftMap = new Map(
    salaryOptions
      .filter(item => item.code !== undefined)
      .map(item => [item.code as number, { ...item }]),
  )
  probationDraftMap = new Map(
    probationSalaryOptions
      .filter(item => item.code !== undefined)
      .map(item => [item.code as number, { ...item }]),
  )
}

/** 同步薪资项草稿 */
function syncDraftMaps() {
  for (const item of formData.value.salaryOptions || []) {
    if (item.code !== undefined) {
      salaryDraftMap.set(item.code, { ...item })
    }
  }
  for (const item of formData.value.probationSalaryOptions || []) {
    if (item.code !== undefined) {
      probationDraftMap.set(item.code, { ...item })
    }
  }
}

/** 获得已选模板的薪资项定义 */
function getSelectedOptionDefinitions() {
  const template = salaryTemplateList.value.find(item => item.id === selectedTemplateId.value)
  if (template?.options?.length) {
    return template.options.map(item => ({
      code: item.code,
      name: item.name,
    }))
  }
  return salaryOptionList.value.map(item => ({ code: item.code, name: item.name }))
}

/** 构建已选模板的薪资项 */
function buildSelectedOptions(draftMap: Map<number, SalaryOptionValue>) {
  return getSelectedOptionDefinitions()
    .filter(item => item.code !== undefined)
    .map((item) => {
      const current = draftMap.get(item.code)
      return {
        code: item.code,
        name: item.name || current?.name,
        value: current?.value ?? 0,
      }
    })
}

/** 应用已选调薪模板 */
function applySelectedTemplate(syncDraft = true) {
  if (syncDraft) {
    syncDraftMaps()
  }
  formData.value.salaryOptions = buildSelectedOptions(salaryDraftMap)
  formData.value.probationSalaryOptions = buildSelectedOptions(probationDraftMap)
}

/** 加载薪资项和调薪模板 */
async function loadSimpleData() {
  const [options, templates, adjustmentMinEffectDate] = await Promise.all([
    getSalaryOptionSimpleList(),
    getSalaryChangeTemplateList(),
    getSalaryAdjustmentMinEffectDate(),
  ])
  salaryOptionList.value = options.filter(
    item => item.parentCode !== HrmSalaryOptionCategoryCode.ROOT && item.calculateEnabled,
  )
  salaryTemplateList.value = templates || []
  minEffectDate.value = adjustmentMinEffectDate || undefined
  selectDefaultTemplate()
}

/** 加载员工薪资档案 */
async function loadSalaryEmployee() {
  if (!formData.value.employeeId) {
    return
  }
  formLoading.value = true
  try {
    const salaryEmployee = await getSalaryEmployeeInfo(formData.value.employeeId)
    if (salaryEmployee?.id) {
      formData.value.recordType = HrmSalaryRecordType.CHANGE
      beforeTotal.value = salaryEmployee.regularSalary || 0
      probationBeforeTotal.value = salaryEmployee.probationSalary || 0
      resetDraftMaps(
        salaryEmployee.salaryOptions?.length
          ? salaryEmployee.salaryOptions
          : buildDefaultOptionValues(),
        salaryEmployee.probationSalaryOptions?.length
          ? salaryEmployee.probationSalaryOptions
          : buildDefaultOptionValues(),
      )
    } else {
      formData.value.recordType = HrmSalaryRecordType.FIXED
      beforeTotal.value = 0
      probationBeforeTotal.value = 0
      resetDraftMaps(buildDefaultOptionValues(), buildDefaultOptionValues())
    }
    applySelectedTemplate(false)
  } finally {
    formLoading.value = false
  }
}

/** 加载编辑记录 */
async function loadRecord() {
  const record = await getSalaryChangeRecord(Number(props.recordId))
  beforeTotal.value = record.beforeTotal || 0
  probationBeforeTotal.value = record.probationBeforeTotal || 0
  formData.value = {
    id: record.id,
    employeeId: record.employeeId || (props.employeeId ? Number(props.employeeId) : undefined),
    recordType: record.recordType,
    changeReason: record.changeReason,
    effectTime: record.effectTime,
    remark: record.remark || '',
    salaryOptions: (record.salaryOptions || []).map(item => ({ ...item })),
    probationSalaryOptions: (record.probationSalaryOptions || []).map(item => ({ ...item })),
  }
  selectedTemplateId.value = undefined
  resetDraftMaps(formData.value.salaryOptions, formData.value.probationSalaryOptions)
}

/** 提交表单 */
async function handleSubmit() {
  if (formData.value.effectTime) {
    formData.value.effectTime = dayjs(formData.value.effectTime).startOf('day').valueOf()
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (
    formData.value.recordType === HrmSalaryRecordType.CHANGE
    && minEffectDate.value
    && formData.value.effectTime
    && dayjs(formData.value.effectTime).isBefore(dayjs(minEffectDate.value), 'day')
  ) {
    toast.error(`生效日期不能早于 ${minEffectDate.value}`)
    return
  }

  // 从行编辑回写到提交字段
  formData.value.salaryOptions = salaryOptionRows.value.map(row => ({
    code: row.code,
    name: row.name,
    value: Number(row.regularOption.value || 0),
  }))
  formData.value.probationSalaryOptions = salaryOptionRows.value.map(row => ({
    code: row.code,
    name: row.name,
    value: Number(row.probationOption.value || 0),
  }))

  formLoading.value = true
  try {
    await updateSalaryEmployeeInfo(formData.value)
    toast.success('保存成功')
    navigateBackPlus()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
async function init() {
  formData.value = createDefaultFormData()
  await loadSimpleData()
  if (props.recordId) {
    await loadRecord()
    return
  }
  if (props.employeeId) {
    formData.value.employeeId = Number(props.employeeId)
    await loadSalaryEmployee()
    return
  }
  selectDefaultTemplate()
  resetDraftMaps(buildDefaultOptionValues(), buildDefaultOptionValues())
  applySelectedTemplate(false)
}

onMounted(() => {
  init()
})
</script>
