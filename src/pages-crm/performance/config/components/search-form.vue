<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          年份
        </view>
        <view class="flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx" @click="yearVisible = true">
          <text class="text-28rpx text-[#333]">
            {{ selectedYearText }}
          </text>
          <wd-icon name="arrow-right" size="32rpx" color="#666" />
        </view>
        <wd-datetime-picker v-model="formData.yearTime" v-model:visible="yearVisible" title="请选择年份" type="year" />
      </view>
      <yd-search-picker v-model="formData.bizType" label="目标类型" :columns="bizTypeColumns" all-option :all-value="0" />
      <yd-search-picker v-model="formData.objectType" label="对象类型" :columns="objectTypeColumns" all-option :all-value="0" />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { PerformanceConfigObjectTypeEnum } from '@/api/crm/performance/config'
import { BizTypeEnum } from '@/api/crm/permission'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate } from '@/utils/date'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()

const now = new Date()
const visible = ref(false) // 搜索弹窗显示状态
const yearVisible = ref(false) // 年份选择器显隐
const formData = reactive({
  yearTime: new Date(now.getFullYear(), 0, 1).getTime(),
  bizType: 0,
  objectType: 0,
}) // 搜索表单数据

const bizTypeColumns = [
  { label: '销售目标', value: BizTypeEnum.CRM_CONTRACT },
  { label: '回款目标', value: BizTypeEnum.CRM_RECEIVABLE },
] // 目标类型选项
const objectTypeColumns = [
  { label: '部门', value: PerformanceConfigObjectTypeEnum.DEPT },
  { label: '员工', value: PerformanceConfigObjectTypeEnum.USER },
] // 对象类型选项

const selectedYear = computed(() => new Date(formData.yearTime).getFullYear())
const selectedYearText = computed(() => formatDate(formData.yearTime, 'YYYY'))
/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions = [`年份:${selectedYearText.value}`]
  if (formData.bizType) {
    conditions.push(`类型:${getBizTypeLabel(formData.bizType)}`)
  }
  if (formData.objectType) {
    conditions.push(`对象:${getObjectTypeLabel(formData.objectType)}`)
  }
  return conditions.join(' | ')
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    year: selectedYear.value,
    bizType: formData.bizType || undefined,
    objectType: formData.objectType || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.yearTime = new Date(now.getFullYear(), 0, 1).getTime()
  formData.bizType = 0
  formData.objectType = 0
  visible.value = false
  emit('reset')
}

/** 获取目标类型名称 */
function getBizTypeLabel(value?: number) {
  return bizTypeColumns.find(item => item.value === value)?.label || ''
}

/** 获取对象类型名称 */
function getObjectTypeLabel(value?: number) {
  return objectTypeColumns.find(item => item.value === value)?.label || ''
}
</script>
