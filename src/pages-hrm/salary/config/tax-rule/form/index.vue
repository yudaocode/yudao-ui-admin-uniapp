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
          <wd-form-item title="方案名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入方案名称"
              :maxlength="64"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.type"
            label="个税类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.HRM_SALARY_TAX_TYPE"
            placeholder="请选择个税类型"
            @confirm="handleTypeChange"
          />
          <wd-form-item title="是否计税" title-width="180rpx" prop="taxEnabled" center>
            <wd-switch
              v-model="formData.taxEnabled"
              :disabled="formData.type === HrmSalaryTaxType.NONE"
            />
          </wd-form-item>
          <template v-if="formData.type !== HrmSalaryTaxType.NONE">
            <wd-form-item title="起征点" title-width="180rpx" prop="threshold">
              <wd-input-number
                v-model="formData.threshold"
                allow-null
                :min="0"
                :precision="2"
              />
            </wd-form-item>
            <wd-form-item title="小数位" title-width="180rpx" prop="decimalScale">
              <wd-input-number
                v-model="formData.decimalScale"
                allow-null
                :min="0"
                :max="4"
                :precision="0"
              />
            </wd-form-item>
            <view class="mx-24rpx mb-16rpx rounded-12rpx bg-[#f0f5ff] px-24rpx py-20rpx text-24rpx text-[#1677ff]">
              工资薪金默认起征点为 5000 元，劳务报酬默认 800 元，起征点不得小于 0；小数位决定个税计算结果保留 0～4 位。
            </view>
          </template>
          <yd-form-picker
            v-if="formData.type === HrmSalaryTaxType.SALARY"
            v-model="formData.cycleType"
            label="计税周期"
            label-width="180rpx"
            prop="cycleType"
            :columns="cycleTypeColumns"
            placeholder="请选择计税周期"
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
import type { SalaryTaxRule } from '@/api/hrm/salary/config/tax-rule'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createSalaryTaxRule,
  getSalaryTaxRule,
  updateSalaryTaxRule,
} from '@/api/hrm/salary/config/tax-rule'
import {
  HrmSalaryTaxCycleType,
  HrmSalaryTaxCycleTypeOptions,
  HrmSalaryTaxType,
} from '@/pages-hrm/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const getTitle = computed(() => props.id ? '编辑计税规则' : '新增计税规则')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<SalaryTaxRule>(createDefaultFormData()) // 表单数据
const cycleTypeColumns = HrmSalaryTaxCycleTypeOptions.map(item => ({ // 计税周期选项
  label: item.label,
  value: item.value,
}))
const formSchema = createFormSchema({
  name: [{ required: true, message: '方案名称不能为空' }],
  type: [{ required: true, message: '个税类型不能为空' }],
  taxEnabled: [{ required: true, message: '是否计税不能为空' }],
  threshold: [{
    required: () => formData.value.type !== HrmSalaryTaxType.NONE,
    message: '起征点不能为空',
  }],
  decimalScale: [{
    required: () => formData.value.type !== HrmSalaryTaxType.NONE,
    message: '小数位不能为空',
  }],
  cycleType: [{
    required: () => formData.value.type === HrmSalaryTaxType.SALARY,
    message: '计税周期不能为空',
  }],
})

/** 创建默认表单数据 */
function createDefaultFormData(): SalaryTaxRule {
  return {
    id: undefined,
    name: '',
    type: HrmSalaryTaxType.SALARY,
    taxEnabled: true,
    threshold: 5000,
    decimalScale: 2,
    cycleType: HrmSalaryTaxCycleType.JANUARY_TO_DECEMBER,
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/salary/config/tax-rule/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getSalaryTaxRule(Number(props.id))
}

/** 切换个税类型 */
function handleTypeChange() {
  if (formData.value.type === HrmSalaryTaxType.SALARY) {
    formData.value.taxEnabled = true
    formData.value.threshold = 5000
    formData.value.decimalScale = 2
    formData.value.cycleType = HrmSalaryTaxCycleType.JANUARY_TO_DECEMBER
  } else if (formData.value.type === HrmSalaryTaxType.REMUNERATION) {
    formData.value.taxEnabled = true
    formData.value.threshold = 800
    formData.value.decimalScale = 2
    formData.value.cycleType = undefined
  } else {
    formData.value.taxEnabled = false
    formData.value.threshold = 0
    formData.value.decimalScale = undefined
    formData.value.cycleType = undefined
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateSalaryTaxRule(formData.value)
      toast.success('修改成功')
    } else {
      await createSalaryTaxRule(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('hrm:salary:tax-rule:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
