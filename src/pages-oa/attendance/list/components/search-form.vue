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
      <UserSearchPicker v-model="formData.userId" label="成员" placeholder="请选择成员" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          考勤类型
        </view>
        <yd-search-picker
          v-model="formData.type"
          :columns="getIntDictOptions(DICT_TYPE.OA_ATTENDANCE_TYPE)"
          all-option
          all-label="全部类型"
          placeholder="请选择考勤类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          考勤状态
        </view>
        <yd-search-picker
          v-model="formData.status"
          :columns="getIntDictOptions(DICT_TYPE.OA_ATTENDANCE_STATUS)"
          all-option
          all-label="全部状态"
          placeholder="请选择考勤状态"
        />
      </view>
      <yd-search-date-range v-model="formData.attendanceTime" label="考勤时间" />
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
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  userId: undefined as number | undefined,
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  attendanceTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.userId !== undefined) {
    conditions.push('已选成员')
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.OA_ATTENDANCE_TYPE, formData.type)}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.OA_ATTENDANCE_STATUS, formData.status)}`)
  }
  if (formData.attendanceTime?.[0] && formData.attendanceTime?.[1]) {
    conditions.push(`考勤:${formatDate(formData.attendanceTime[0])}~${formatDate(formData.attendanceTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索考勤'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    userId: formData.userId,
    type: formData.type,
    status: formData.status,
    attendanceTime: formatDateRange(formData.attendanceTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.userId = undefined
  formData.type = undefined
  formData.status = undefined
  formData.attendanceTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
