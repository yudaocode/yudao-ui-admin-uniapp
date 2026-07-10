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
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          会话类型
        </view>
        <wd-radio-group v-model="formData.conversationType" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          媒体类型
        </view>
        <wd-radio-group v-model="formData.mediaType" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          通话状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_RTC_CALL_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          结束原因
        </view>
        <wd-radio-group v-model="formData.endReason" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_RTC_CALL_END_REASON)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
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
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
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
  conversationType: -1, // -1 表示全部
  mediaType: -1, // -1 表示全部
  status: -1, // -1 表示全部
  endReason: -1, // -1 表示全部
  startTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.inviterUserId) {
    conditions.push(`发起人:${inviterPickerRef.value?.format(formData.inviterUserId) || formData.inviterUserId}`)
  }
  if (formData.conversationType !== -1) {
    conditions.push(`会话:${getDictLabel(DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE, formData.conversationType)}`)
  }
  if (formData.mediaType !== -1) {
    conditions.push(`媒体:${getDictLabel(DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE, formData.mediaType)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.IM_RTC_CALL_STATUS, formData.status)}`)
  }
  if (formData.endReason !== -1) {
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
    conversationType: formData.conversationType === -1 ? undefined : formData.conversationType,
    mediaType: formData.mediaType === -1 ? undefined : formData.mediaType,
    status: formData.status === -1 ? undefined : formData.status,
    endReason: formData.endReason === -1 ? undefined : formData.endReason,
    startTime: formatDateRange(formData.startTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.inviterUserId = undefined
  formData.conversationType = -1
  formData.mediaType = -1
  formData.status = -1
  formData.endReason = -1
  formData.startTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
