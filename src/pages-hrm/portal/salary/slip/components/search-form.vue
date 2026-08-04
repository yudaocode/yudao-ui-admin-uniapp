<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          开始月份
        </view>
        <view
          class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx"
          @click="startMonthVisible = true"
        >
          <text class="min-w-0 flex-1 truncate text-[#333]">
            {{ startMonthText }}
          </text>
          <wd-icon
            v-if="formData.startMonth"
            name="close-circle-filled"
            size="32rpx"
            color="#c8c9cc"
            @click.stop="formData.startMonth = ''"
          />
          <wd-icon name="arrow-right" size="32rpx" color="#666" />
        </view>
        <wd-datetime-picker
          v-model="formData.startMonth"
          v-model:visible="startMonthVisible"
          title="请选择开始月份"
          type="year-month"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          结束月份
        </view>
        <view
          class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx"
          @click="endMonthVisible = true"
        >
          <text class="min-w-0 flex-1 truncate text-[#333]">
            {{ endMonthText }}
          </text>
          <wd-icon
            v-if="formData.endMonth"
            name="close-circle-filled"
            size="32rpx"
            color="#c8c9cc"
            @click.stop="formData.endMonth = ''"
          />
          <wd-icon name="arrow-right" size="32rpx" color="#666" />
        </view>
        <wd-datetime-picker
          v-model="formData.endMonth"
          v-model:visible="endMonthVisible"
          title="请选择结束月份"
          type="year-month"
        />
      </view>
      <yd-search-picker
        v-model="formData.sort"
        label="排序方式"
        :columns="sortColumns"
      />
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
import {
  HRM_SALARY_SLIP_SORT_OPTIONS,
  HrmSalarySlipSort,
} from '@/pages-hrm/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const startMonthVisible = ref(false) // 开始月份选择器显隐
const endMonthVisible = ref(false) // 结束月份选择器显隐
const formData = reactive({
  startMonth: '' as number | string,
  endMonth: '' as number | string,
  sort: HrmSalarySlipSort.RECENT_SEND as number,
}) // 搜索表单数据

const sortColumns = HRM_SALARY_SLIP_SORT_OPTIONS.map(item => ({
  label: item.label,
  value: item.value,
}))
const startMonthText = computed(() => {
  if (!formData.startMonth) {
    return '全部'
  }
  return formatDate(formData.startMonth, 'YYYY-MM') || '-'
})
const endMonthText = computed(() => {
  if (!formData.endMonth) {
    return '全部'
  }
  return formatDate(formData.endMonth, 'YYYY-MM') || '-'
})
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.startMonth || formData.endMonth) {
    conditions.push(`月份:${startMonthText.value}~${endMonthText.value}`)
  }
  const sortLabel = sortColumns.find(item => item.value === formData.sort)?.label
  if (sortLabel && formData.sort !== HrmSalarySlipSort.RECENT_SEND) {
    conditions.push(`排序:${sortLabel}`)
  }
  return conditions.length ? conditions.join(' | ') : '搜索我的工资条'
})

/** 组装搜索参数 */
function buildSearchData() {
  const startMonth = formData.startMonth
    ? formatDate(formData.startMonth, 'YYYY-MM') || undefined
    : undefined
  const endMonth = formData.endMonth
    ? formatDate(formData.endMonth, 'YYYY-MM') || undefined
    : undefined
  return {
    startMonth: startMonth && endMonth ? startMonth : undefined,
    endMonth: startMonth && endMonth ? endMonth : undefined,
    sort: formData.sort,
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildSearchData())
}

/** 重置按钮操作 */
function handleReset() {
  formData.startMonth = ''
  formData.endMonth = ''
  formData.sort = HrmSalarySlipSort.RECENT_SEND
  visible.value = false
  emit('reset')
}
</script>
