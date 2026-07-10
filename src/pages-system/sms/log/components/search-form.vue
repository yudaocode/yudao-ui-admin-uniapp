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
          手机号
        </view>
        <wd-input
          v-model="formData.mobile"
          placeholder="请输入手机号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          发送状态
        </view>
        <wd-radio-group v-model="formData.sendStatus" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_SMS_SEND_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          接收状态
        </view>
        <wd-radio-group v-model="formData.receiveStatus" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <SmsChannelSearchPicker ref="channelPickerRef" v-model="formData.channelId" />
      <yd-search-date-range v-model="formData.sendTime" label="发送时间" />
      <yd-search-date-range v-model="formData.receiveTime" label="接收时间" />
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
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import SmsChannelSearchPicker from '../../channel/components/search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const channelPickerRef = ref<InstanceType<typeof SmsChannelSearchPicker>>() // 短信渠道选择器
const formData = reactive({
  mobile: undefined as string | undefined,
  channelId: undefined as number | undefined,
  sendStatus: -1,
  receiveStatus: -1,
  sendTime: [undefined, undefined] as [number | undefined, number | undefined],
  receiveTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.mobile) {
    conditions.push(`手机号:${formData.mobile}`)
  }
  if (formData.channelId) {
    conditions.push(`渠道:${channelPickerRef.value?.format(formData.channelId) || formData.channelId}`)
  }
  if (formData.sendStatus !== -1) {
    conditions.push(`发送:${getDictLabel(DICT_TYPE.SYSTEM_SMS_SEND_STATUS, formData.sendStatus)}`)
  }
  if (formData.receiveStatus !== -1) {
    conditions.push(`接收:${getDictLabel(DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS, formData.receiveStatus)}`)
  }
  if (formData.sendTime?.[0] && formData.sendTime?.[1]) {
    conditions.push(`发送时间:${formatDate(formData.sendTime[0])}~${formatDate(formData.sendTime[1])}`)
  }
  if (formData.receiveTime?.[0] && formData.receiveTime?.[1]) {
    conditions.push(`接收时间:${formatDate(formData.receiveTime[0])}~${formatDate(formData.receiveTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索短信日志'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    mobile: formData.mobile || undefined,
    channelId: formData.channelId,
    sendStatus: formData.sendStatus === -1 ? undefined : formData.sendStatus,
    receiveStatus: formData.receiveStatus === -1 ? undefined : formData.receiveStatus,
    sendTime: formatDateRange(formData.sendTime),
    receiveTime: formatDateRange(formData.receiveTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.mobile = undefined
  formData.channelId = undefined
  formData.sendStatus = -1
  formData.receiveStatus = -1
  formData.sendTime = [undefined, undefined]
  formData.receiveTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
