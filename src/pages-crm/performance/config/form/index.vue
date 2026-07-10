<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="年份" title-width="180rpx" prop="year" is-link :value="selectedYearText" placeholder="请选择年份" @click="yearVisible = true" />
          <wd-datetime-picker v-model="yearPickerValue" v-model:visible="yearVisible" title="请选择年份" type="year" />
          <yd-form-picker v-model="formData.bizType" label="目标类型" label-width="180rpx" prop="bizType" :columns="bizTypeColumns" placeholder="请选择目标类型" />
          <yd-form-picker v-model="formData.objectType" label="对象类型" label-width="180rpx" prop="objectType" :columns="objectTypeColumns" placeholder="请选择对象类型" @confirm="handleObjectTypeConfirm" />
          <DeptFormPicker
            v-if="formData.objectType === PerformanceConfigObjectTypeEnum.DEPT"
            v-model="formData.objectId"
            label="目标对象"
            label-width="180rpx"
            prop="objectId"
            placeholder="请选择部门"
          />
          <UserFormPicker
            v-else
            v-model="formData.objectId"
            label="目标对象"
            label-width="180rpx"
            prop="objectId"
            placeholder="请选择员工"
          />
        </wd-cell-group>

        <wd-cell-group title="月度目标" border>
          <wd-form-item
            v-for="month in monthFields"
            :key="month.prop"
            :title="month.label"
            title-width="180rpx"
            :prop="month.prop"
          >
            <wd-input-number v-model="formData[month.prop]" :min="0" :precision="2" input-type="number" placeholder="请输入目标金额" />
          </wd-form-item>
          <wd-form-item title="年度目标" title-width="180rpx">
            <view class="text-28rpx text-[#333]">
              {{ yearTargetText }}
            </view>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { PerformanceConfig } from '@/api/crm/performance/config'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPerformanceConfig,
  getPerformanceConfig,
  PerformanceConfigObjectTypeEnum,
  updatePerformanceConfig,
} from '@/api/crm/performance/config'
import { BizTypeEnum } from '@/api/crm/permission'
import { DeptFormPicker, UserFormPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { formatMoney } from '@/utils/format'
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
const now = new Date()
const getTitle = computed(() => props.id ? '编辑业绩目标' : '新增业绩目标')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const yearVisible = ref(false) // 年份选择器显隐
const formData = ref<PerformanceConfig>({
  year: now.getFullYear(),
  bizType: BizTypeEnum.CRM_CONTRACT,
  objectType: PerformanceConfigObjectTypeEnum.DEPT,
  objectId: undefined,
  januaryTargetPrice: 0,
  februaryTargetPrice: 0,
  marchTargetPrice: 0,
  aprilTargetPrice: 0,
  mayTargetPrice: 0,
  juneTargetPrice: 0,
  julyTargetPrice: 0,
  augustTargetPrice: 0,
  septemberTargetPrice: 0,
  octoberTargetPrice: 0,
  novemberTargetPrice: 0,
  decemberTargetPrice: 0,
}) // 表单数据

const bizTypeColumns = [
  { label: '销售目标', value: BizTypeEnum.CRM_CONTRACT },
  { label: '回款目标', value: BizTypeEnum.CRM_RECEIVABLE },
] // 目标类型选项
const objectTypeColumns = [
  { label: '部门', value: PerformanceConfigObjectTypeEnum.DEPT },
  { label: '员工', value: PerformanceConfigObjectTypeEnum.USER },
] // 对象类型选项
const monthFields = [
  { label: '一月', prop: 'januaryTargetPrice' },
  { label: '二月', prop: 'februaryTargetPrice' },
  { label: '三月', prop: 'marchTargetPrice' },
  { label: '四月', prop: 'aprilTargetPrice' },
  { label: '五月', prop: 'mayTargetPrice' },
  { label: '六月', prop: 'juneTargetPrice' },
  { label: '七月', prop: 'julyTargetPrice' },
  { label: '八月', prop: 'augustTargetPrice' },
  { label: '九月', prop: 'septemberTargetPrice' },
  { label: '十月', prop: 'octoberTargetPrice' },
  { label: '十一月', prop: 'novemberTargetPrice' },
  { label: '十二月', prop: 'decemberTargetPrice' },
] as const // 月目标字段
const formSchema = createFormSchema({
  year: [{ required: true, message: '年份不能为空' }],
  bizType: [{ required: true, message: '目标类型不能为空' }],
  objectType: [{ required: true, message: '对象类型不能为空' }],
  objectId: [{ required: true, message: '目标对象不能为空' }],
})

const yearPickerValue = computed({
  get: () => new Date(Number(formData.value.year), 0, 1).getTime(),
  set: (value) => {
    formData.value.year = new Date(value).getFullYear()
  },
})
const selectedYearText = computed(() => formatDate(yearPickerValue.value, 'YYYY'))
const yearTargetPrice = computed(() => monthFields.reduce((sum, month) => sum + Number(formData.value[month.prop] || 0), 0))
const yearTargetText = computed(() => formatMoney(yearTargetPrice.value))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPerformanceConfig(Number(props.id))
  formData.value = {
    ...formData.value,
    ...data,
  }
}

/** 对象类型确认 */
function handleObjectTypeConfirm(value: number) {
  formData.value.objectId = undefined
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
      await updatePerformanceConfig(formData.value)
      toast.success('修改成功')
    } else {
      await createPerformanceConfig(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:performance-config:reload')
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
