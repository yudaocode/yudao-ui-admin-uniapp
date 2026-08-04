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
      <yd-search-date-range v-model="formData.date" label="日期" />
      <yd-search-picker
        v-model="formData.type"
        label="日期类型"
        :dict-type="DICT_TYPE.HRM_ATTENDANCE_HOLIDAY_TYPE"
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
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({ // 搜索表单数据
  date: [undefined, undefined] as [any, any],
  type: undefined as number | undefined,
})

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.date[0] && formData.date[1]) {
    conditions.push(`日期:${formatDate(formData.date[0])}~${formatDate(formData.date[1])}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.HRM_ATTENDANCE_HOLIDAY_TYPE, formData.type)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索节假日'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    date: formatDateRange(formData.date),
    type: formData.type,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.date = [undefined, undefined]
  formData.type = undefined
  visible.value = false
  emit('reset')
}
</script>
