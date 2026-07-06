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
          用户
        </view>
        <UserPicker ref="userPickerRef" v-model="formData.userId" type="radio" placeholder="请选择用户" />
      </view>
      <WorkstationSearchPicker ref="workstationSearchPickerRef" v-model="formData.workstationId" label="工作站" placeholder="请选择工作站" />
      <yd-search-picker v-model="formData.type" label="操作类型" :dict-type="DICT_TYPE.MES_PRO_WORK_RECORD_TYPE" all-option />
      <yd-search-date-range v-model="createTimeRange" label="操作时间" />
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
import UserPicker from '@/components/system-select/user-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import WorkstationSearchPicker from '@/pages-mes/md/workstation/components/workstation-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const createTimeRange = ref<[number | undefined, number | undefined]>([undefined, undefined]) // 操作时间范围
const workstationSearchPickerRef = ref<InstanceType<typeof WorkstationSearchPicker>>() // 工作站搜索选择器
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 用户选择器
const formData = reactive({
  userId: undefined,
  workstationId: undefined,
  type: undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  const userName = userPickerRef.value?.getUserNickname(formData.userId)
  if (userName) {
    conditions.push(`用户:${userName}`)
  }
  if (formData.workstationId) {
    conditions.push(`工作站:${workstationSearchPickerRef.value?.format(formData.workstationId) || formData.workstationId}`)
  }
  if (formData.type != null && formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_PRO_WORK_RECORD_TYPE, formData.type)}`)
  }
  if (createTimeRange.value[0] && createTimeRange.value[1]) {
    conditions.push(`操作时间:${formatDate(createTimeRange.value[0])}~${formatDate(createTimeRange.value[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索工作记录'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    userId: formData.userId,
    workstationId: formData.workstationId,
    type: formData.type === -1 ? undefined : formData.type,
    createTime: formatDateRange(createTimeRange.value),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.userId = undefined
  formData.workstationId = undefined
  formData.type = undefined
  createTimeRange.value = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
