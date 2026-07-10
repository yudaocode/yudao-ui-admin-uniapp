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
          任务编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入任务编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          任务名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入任务名称" clearable />
      </view>
      <yd-search-picker
        ref="typeSearchPickerRef"
        v-model="formData.type"
        label="盘点类型"
        :dict-type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE"
        all-option
      />
      <yd-search-date-range v-model="formData.takingDate" label="盘点日期" />
      <yd-search-picker
        ref="statusSearchPickerRef"
        v-model="formData.status"
        label="单据状态"
        :dict-type="DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS"
        all-option
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
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'

interface SearchFormData {
  code?: string
  name?: string
  type?: number
  takingDate?: [number | undefined, number | undefined]
  status?: number
}

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const typeSearchPickerRef = ref<YdSearchPickerExpose>() // 类型搜索选择器
const statusSearchPickerRef = ref<YdSearchPickerExpose>() // 状态搜索选择器
const formData = reactive<SearchFormData>({
  code: undefined,
  name: undefined,
  type: undefined,
  takingDate: undefined,
  status: undefined,
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索条件摘要
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.type != null && formData.type !== -1) {
    conditions.push(`类型:${typeSearchPickerRef.value?.format(formData.type) || formData.type}`)
  }
  if (formData.status != null && formData.status !== -1) {
    conditions.push(`状态:${statusSearchPickerRef.value?.format(formData.status) || formData.status}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索盘点任务'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    type: formData.type === -1 ? undefined : formData.type,
    takingDate: formatDateRange(formData.takingDate),
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.type = undefined
  formData.takingDate = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
