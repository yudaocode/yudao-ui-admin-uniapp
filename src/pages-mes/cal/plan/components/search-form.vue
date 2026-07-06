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
          计划编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入计划编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          计划名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入计划名称" clearable />
      </view>
      <yd-search-picker v-model="formData.calendarType" label="班组类型" :dict-type="DICT_TYPE.MES_CAL_CALENDAR_TYPE" all-option />
      <yd-search-picker v-model="formData.shiftType" label="轮班方式" :dict-type="DICT_TYPE.MES_CAL_SHIFT_TYPE" all-option />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.MES_CAL_PLAN_STATUS" all-option />
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
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  code: '',
  name: '',
  calendarType: -1,
  shiftType: -1,
  status: -1,
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索摘要
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.calendarType !== -1) {
    conditions.push(`班组:${getDictLabel(DICT_TYPE.MES_CAL_CALENDAR_TYPE, formData.calendarType)}`)
  }
  if (formData.shiftType !== -1) {
    conditions.push(`轮班:${getDictLabel(DICT_TYPE.MES_CAL_SHIFT_TYPE, formData.shiftType)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_CAL_PLAN_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索排班计划'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    calendarType: formData.calendarType === -1 ? undefined : formData.calendarType,
    shiftType: formData.shiftType === -1 ? undefined : formData.shiftType,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.calendarType = -1
  formData.shiftType = -1
  formData.status = -1
  visible.value = false
  emit('reset')
}
</script>
