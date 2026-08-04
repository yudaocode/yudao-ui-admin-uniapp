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
          <wd-form-item title="薪资组" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入薪资组名称"
              :maxlength="64"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.taxRuleId"
            label="计税规则"
            label-width="180rpx"
            prop="taxRuleId"
            :columns="taxRuleColumns"
            placeholder="请选择计税规则"
          />
          <wd-cell title="计薪标准" :value="`${HRM_SALARY_GROUP_DEFAULT_STANDARD} 天 / 月`" />
          <wd-cell title="调薪规则" :value="HRM_SALARY_GROUP_DEFAULT_CHANGE_RULE_LABEL" />
        </wd-cell-group>

        <wd-cell-group border title="适用范围" class="mt-24rpx">
          <yd-tree-select
            v-model="formData.deptIds"
            label="部门范围"
            label-width="180rpx"
            placeholder="请选择部门"
            :data="deptOptions"
            :props="treeProps"
            multiple
            check-strictly
          />
          <EmployeeFormPicker
            v-model="formData.employeeIds"
            type="checkbox"
            label="员工范围"
            label-width="180rpx"
            prop="employeeIds"
            placeholder="请选择员工"
          />
        </wd-cell-group>
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
import type { Dept } from '@/api/system/dept'
import type { SalaryGroup } from '@/api/hrm/salary/config/group'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createSalaryGroup,
  getSalaryGroup,
  updateSalaryGroup,
} from '@/api/hrm/salary/config/group'
import { getSalaryTaxRuleList } from '@/api/hrm/salary/config/tax-rule'
import { getSimpleDeptList } from '@/api/system/dept'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'
import {
  HRM_SALARY_GROUP_DEFAULT_CHANGE_RULE_LABEL,
  HRM_SALARY_GROUP_DEFAULT_STANDARD,
} from '@/pages-hrm/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'

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
const getTitle = computed(() => props.id ? '编辑薪资组' : '新增薪资组')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const deptList = ref<Dept[]>([]) // 部门列表
const taxRuleColumns = ref<{ label: string, value: number }[]>([]) // 计税规则选项
const formData = ref<SalaryGroup>(createDefaultFormData()) // 表单数据
const treeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
} // 树字段映射
const deptOptions = computed(() => handleTree(deptList.value)) // 部门树形选项
const formSchema = createFormSchema({
  name: [{ required: true, message: '薪资组名称不能为空' }],
  taxRuleId: [{ required: true, message: '计税规则不能为空' }],
})

/** 创建默认表单数据 */
function createDefaultFormData(): SalaryGroup {
  return {
    id: undefined,
    name: '',
    taxRuleId: undefined,
    deptIds: [],
    employeeIds: [],
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/salary/config/group/index')
}

/** 加载基础选项 */
async function loadOptions() {
  const [departments, taxRules] = await Promise.all([
    getSimpleDeptList(),
    getSalaryTaxRuleList(),
  ])
  deptList.value = departments
  taxRuleColumns.value = taxRules
    .filter(item => item.id != null)
    .map(item => ({
      label: item.name,
      value: item.id!,
    }))
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getSalaryGroup(Number(props.id))
  formData.value.deptIds = formData.value.deptIds || []
  formData.value.employeeIds = formData.value.employeeIds || []
}

/** 提交表单 */
async function handleSubmit() {
  formData.value.deptIds = (formData.value.deptIds || []).map(Number)
  formData.value.employeeIds = (formData.value.employeeIds || []).map(Number)

  if (!formData.value.deptIds.length && !formData.value.employeeIds.length) {
    toast.error('适用部门和适用员工不能同时为空')
    return
  }

  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateSalaryGroup(formData.value)
      toast.success('修改成功')
    } else {
      await createSalaryGroup(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('hrm:salary:group:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
