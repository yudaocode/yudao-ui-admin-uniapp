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
      <UserSearchPicker ref="inviterPickerRef" v-model="formData.inviterUserId" label="发起人" placeholder="请选择发起人" />
      <yd-search-picker
        v-model="formData.conversationType"
        label="会话类型"
        :dict-type="DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE"
        all-option
      />
      <yd-search-picker v-model="formData.mediaType" label="媒体类型" :dict-type="DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE" all-option />
      <yd-search-picker v-model="formData.status" label="通话状态" :dict-type="DICT_TYPE.IM_RTC_CALL_STATUS" all-option />
      <yd-search-picker v-model="formData.endReason" label="结束原因" :dict-type="DICT_TYPE.IM_RTC_CALL_END_REASON" all-option />
      <yd-search-date-range v-model="formData.startTime" label="发起时间" />
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
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const inviterPickerRef = ref<any>() // 发起人选择器引用
const formData = reactive({
  inviterUserId: undefined as number | undefined,
  conversationType: undefined as number | undefined,
  mediaType: undefined as number | undefined,
  status: undefined as number | undefined,
  endReason: undefined as number | undefined,
  startTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.inviterUserId) {
    conditions.push(`发起人:${inviterPickerRef.value?.format(formData.inviterUserId) || formData.inviterUserId}`)
  }
  if (formData.conversationType !== undefined) {
    conditions.push(`会话:${getDictLabel(DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE, formData.conversationType)}`)
  }
  if (formData.mediaType !== undefined) {
    conditions.push(`媒体:${getDictLabel(DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE, formData.mediaType)}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.IM_RTC_CALL_STATUS, formData.status)}`)
  }
  if (formData.endReason !== undefined) {
    conditions.push(`结束:${getDictLabel(DICT_TYPE.IM_RTC_CALL_END_REASON, formData.endReason)}`)
  }
  if (formData.startTime?.[0] && formData.startTime?.[1]) {
    conditions.push(`发起时间:${formatDate(formData.startTime[0])}~${formatDate(formData.startTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索通话记录'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    inviterUserId: formData.inviterUserId,
    conversationType: formData.conversationType,
    mediaType: formData.mediaType,
    status: formData.status,
    endReason: formData.endReason,
    startTime: formatDateRange(formData.startTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.inviterUserId = undefined
  formData.conversationType = undefined
  formData.mediaType = undefined
  formData.status = undefined
  formData.endReason = undefined
  formData.startTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
