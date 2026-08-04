<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="计薪设置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <view v-if="loading" class="py-80rpx text-center text-28rpx text-[#999]">
        加载中...
      </view>
      <template v-else>
        <view
          v-if="initialized"
          class="mx-24rpx mt-24rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-20rpx text-24rpx text-[#1677ff]"
        >
          计薪初始化已完成，仅可调整对应社保自然月。
        </view>

        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border class="mt-24rpx">
            <wd-form-item title="计薪周期开始日" title-width="220rpx" prop="cycleStartDay">
              <wd-input-number
                v-model="formData.cycleStartDay"
                :disabled="initialized"
                :min="1"
                :max="31"
                :precision="0"
              />
            </wd-form-item>
            <wd-cell title="工资周期结束日" :value="String(cycleEndDay)" />
            <wd-form-item
              v-if="!initialized"
              title="薪资启用月份"
              title-width="220rpx"
              prop="startYearMonth"
              is-link
              :value="startYearMonthText"
              placeholder="请选择月份"
              @click="monthVisible = true"
            />
            <wd-form-item
              title="对应社保自然月"
              title-width="220rpx"
              prop="socialSecurityMonthType"
              vertical
            >
              <wd-radio-group v-model="formData.socialSecurityMonthType" type="button">
                <wd-radio
                  v-for="item in socialSecurityMonthTypeColumns"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </template>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="!loading && hasAccessByCodes(['hrm:salary:config:update'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" :disabled="formLoading" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>

    <wd-datetime-picker
      v-model="formData.startYearMonth"
      v-model:visible="monthVisible"
      title="请选择月份"
      type="year-month"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import dayjs from 'dayjs'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createSalaryConfig,
  getSalaryConfig,
  updateSalaryConfig,
} from '@/api/hrm/salary/config/config'
import { useAccess } from '@/hooks/useAccess'
import {
  HrmSalarySocialSecurityMonthType,
  HrmSalarySocialSecurityMonthTypeOptions,
} from '@/pages-hrm/utils/constants'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

interface SalaryConfigFormData {
  cycleStartDay: number
  socialSecurityMonthType: number
  startYearMonth: string | number
}

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const loading = ref(true) // 配置加载中
const formLoading = ref(false) // 表单提交状态
const initialized = ref(false) // 是否已完成计薪初始化
const monthVisible = ref(false) // 月份选择器显隐
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<SalaryConfigFormData>(createDefaultFormData()) // 表单数据
const socialSecurityMonthTypeColumns = HrmSalarySocialSecurityMonthTypeOptions.map(item => ({ // 对应社保自然月选项
  label: item.label,
  value: item.value,
}))

const cycleEndDay = computed(() => formData.value.cycleStartDay === 1 ? 31 : formData.value.cycleStartDay - 1) // 工资周期结束日

const startYearMonthText = computed(() => { // 薪资启用月份展示文案
  if (!formData.value.startYearMonth) {
    return ''
  }
  return formatDate(formData.value.startYearMonth, 'YYYY-MM') || ''
})

const formSchema = createFormSchema({
  cycleStartDay: [{ required: () => !initialized.value, message: '计薪周期开始日不能为空' }],
  socialSecurityMonthType: [{ required: true, message: '对应社保自然月不能为空' }],
  startYearMonth: [{ required: () => !initialized.value, message: '薪资启用月份不能为空' }],
})

/** 创建默认表单数据 */
function createDefaultFormData(): SalaryConfigFormData {
  return {
    cycleStartDay: 1,
    socialSecurityMonthType: HrmSalarySocialSecurityMonthType.PREVIOUS_MONTH,
    startYearMonth: '',
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载计薪配置 */
async function loadConfig(showLoading = true) {
  if (showLoading) {
    loading.value = true
  }
  try {
    const data = await getSalaryConfig()
    initialized.value = Boolean(data?.startYear && data?.startMonth)
    if (data) {
      formData.value = {
        cycleStartDay: data.cycleStartDay ?? 1,
        socialSecurityMonthType:
          data.socialSecurityMonthType ?? HrmSalarySocialSecurityMonthType.PREVIOUS_MONTH,
        startYearMonth:
          data.startYear && data.startMonth
            ? dayjs(`${data.startYear}-${String(data.startMonth).padStart(2, '0')}-01`).valueOf()
            : '',
      }
    } else {
      formData.value = createDefaultFormData()
    }
  } finally {
    if (showLoading) {
      loading.value = false
    }
  }
}

/** 重置按钮操作 */
function handleReset() {
  loadConfig(false)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (initialized.value) {
      await updateSalaryConfig({
        socialSecurityMonthType: formData.value.socialSecurityMonthType,
      })
      toast.success('修改成功')
    } else {
      const monthDate = dayjs(formData.value.startYearMonth)
      await createSalaryConfig({
        cycleStartDay: formData.value.cycleStartDay,
        socialSecurityMonthType: formData.value.socialSecurityMonthType,
        startYear: monthDate.year(),
        startMonth: monthDate.month() + 1,
      })
      toast.success('创建成功')
    }
    await loadConfig(false)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadConfig()
})
</script>
