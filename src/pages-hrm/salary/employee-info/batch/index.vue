<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="批量调薪"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-tree-select
            v-model="formData.deptIds"
            label="部门范围"
            label-width="180rpx"
            placeholder="请选择调薪部门"
            :data="deptOptions"
            :props="treeProps"
            multiple
            check-strictly
          />
          <EmployeeFormPicker
            v-model="formData.employeeIds"
            type="checkbox"
            label="指定员工"
            placeholder="请选择调薪员工"
          />
          <yd-form-picker
            v-model="formData.changeReason"
            label="调整原因"
            label-width="180rpx"
            prop="changeReason"
            :dict-type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
            placeholder="请选择调整原因"
          />
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
            v-model="formData.type"
            label="调薪方式"
            label-width="180rpx"
            prop="type"
            :columns="adjustTypeColumns"
            placeholder="请选择调薪方式"
          />
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
        批量调整将在生效日期前保持待生效，不会提前修改所选员工的薪资档案。
      </view>

      <view class="mx-24rpx mt-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          调薪项
        </view>
        <view
          v-for="item in formData.salaryOptions"
          :key="item.code"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-8rpx text-28rpx text-[#333] font-medium">
            {{ item.name || '-' }}
          </view>
          <view class="mb-16rpx text-24rpx text-[#999]">
            编码：{{ item.code ?? '-' }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            {{ formData.type === HrmSalaryBatchAdjustType.PERCENT ? '调薪比例（%）' : '调薪金额（元）' }}
          </view>
          <wd-input-number
            v-model="item.value"
            allow-null
            :precision="2"
            :min="formData.type === HrmSalaryBatchAdjustType.PERCENT ? -9999.99 : -9999999.99"
            :max="formData.type === HrmSalaryBatchAdjustType.PERCENT ? 9999.99 : 9999999.99"
          />
        </view>
        <view v-if="!formData.salaryOptions.length" class="rounded-12rpx bg-white p-48rpx text-center text-28rpx text-[#999]">
          暂无可调薪项
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
import type { Dept } from '@/api/system/dept'
import type { SalaryEmployeeInfoUpdateListReq } from '@/api/hrm/salary/employee-info'
import dayjs from 'dayjs'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getSimpleDeptList } from '@/api/system/dept'
import { getSalaryOptionSimpleList } from '@/api/hrm/salary/config/option'
import {
  getSalaryAdjustmentMinEffectDate,
  updateSalaryEmployeeInfoList,
} from '@/api/hrm/salary/employee-info'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'
import {
  HrmSalaryBatchAdjustType,
  HrmSalaryChangeReason,
  HrmSalaryOptionCategoryCode,
} from '@/pages-hrm/utils/constants'
import { navigateBackPlus } from '@/utils'
import { handleTree } from '@/utils/tree'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单引用
const formLoading = ref(false) // 表单提交状态
const minEffectDate = ref<string>() // 最早调薪生效日期
const deptList = ref<Dept[]>([]) // 部门列表
const effectTimeVisible = ref(false) // 生效日期选择器显隐
const formData = ref<SalaryEmployeeInfoUpdateListReq>(createDefaultFormData()) // 表单数据
const treeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
} // 树字段映射
const adjustTypeColumns = [ // 调薪方式选项
  { value: HrmSalaryBatchAdjustType.PERCENT, label: '按比例调薪' },
  { value: HrmSalaryBatchAdjustType.AMOUNT, label: '按金额调薪' },
]

const formSchema = createFormSchema({
  type: [{ required: true, message: '调薪方式不能为空' }],
  changeReason: [{ required: true, message: '调整原因不能为空' }],
  effectTime: [{ required: true, message: '生效日期不能为空' }],
})

const deptOptions = computed(() => handleTree(deptList.value)) // 部门树形选项
const isPendingChange = computed(() => // 是否为待生效调薪
  !!formData.value.effectTime && dayjs(formData.value.effectTime).isAfter(dayjs(), 'day'),
)

/** 创建表单默认值 */
function createDefaultFormData(): SalaryEmployeeInfoUpdateListReq {
  return {
    employeeIds: [],
    deptIds: [],
    type: HrmSalaryBatchAdjustType.PERCENT,
    changeReason: HrmSalaryChangeReason.ENTRY_SALARY,
    effectTime: dayjs().startOf('day').valueOf(),
    remark: '',
    salaryOptions: [],
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载基础数据 */
async function loadSimpleData() {
  formLoading.value = true
  try {
    const [options, departments, adjustmentMinEffectDate] = await Promise.all([
      getSalaryOptionSimpleList(),
      getSimpleDeptList(),
      getSalaryAdjustmentMinEffectDate(),
    ])
    deptList.value = departments
    formData.value.salaryOptions = options
      .filter(option => option.parentCode === HrmSalaryOptionCategoryCode.BASIC_SALARY)
      .map(option => ({ code: option.code, name: option.name, value: 0 }))
    minEffectDate.value = adjustmentMinEffectDate || undefined
  } finally {
    formLoading.value = false
  }
}

/** 提交批量调薪 */
async function handleSubmit() {
  if (formData.value.effectTime) {
    formData.value.effectTime = dayjs(formData.value.effectTime).startOf('day').valueOf()
  }
  formData.value.deptIds = (formData.value.deptIds || []).map(Number)
  formData.value.employeeIds = (formData.value.employeeIds || []).map(Number)
  formData.value.salaryOptions = (formData.value.salaryOptions || []).map(item => ({
    ...item,
    value: Number(item.value || 0),
  }))

  if (!formData.value.employeeIds.length && !formData.value.deptIds.length) {
    toast.error('至少需要选择一个部门或员工')
    return
  }

  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (
    minEffectDate.value
    && formData.value.effectTime
    && dayjs(formData.value.effectTime).isBefore(dayjs(minEffectDate.value), 'day')
  ) {
    toast.error(`生效日期不能早于 ${minEffectDate.value}`)
    return
  }

  formLoading.value = true
  try {
    const data = await updateSalaryEmployeeInfoList(formData.value)
    const successCount = data.successEmployeeIds.length
    const failureCount = Object.keys(data.failureEmployeeReasons || {}).length
    const content = `批量调薪完成：成功 ${successCount} 人，失败 ${failureCount} 人`
    if (failureCount === 0) {
      toast.success(content)
    } else if (successCount > 0) {
      toast.warning(content)
    } else {
      toast.error(content)
    }
    if (successCount > 0) {
      navigateBackPlus()
    }
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadSimpleData()
})
</script>
