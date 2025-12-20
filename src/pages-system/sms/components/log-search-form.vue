<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" @close="visible = false">
    <view class="yd-search-form-container" :style="{ paddingTop: `${getNavbarHeight()}px` }">
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
        <wd-radio-group v-model="formData.sendStatus" shape="button">
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
        <wd-radio-group v-model="formData.receiveStatus" shape="button">
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
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          发送时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="visibleSendTime[0] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.sendTime?.[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="visibleSendTime[1] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.sendTime?.[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker-view v-if="visibleSendTime[0]" v-model="tempSendTime[0]" type="date" />
        <view v-if="visibleSendTime[0]" class="yd-search-form-date-range-actions">
          <wd-button size="small" plain @click="visibleSendTime[0] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleSendTime0Confirm">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view v-if="visibleSendTime[1]" v-model="tempSendTime[1]" type="date" />
        <view v-if="visibleSendTime[1]" class="yd-search-form-date-range-actions">
          <wd-button size="small" plain @click="visibleSendTime[1] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleSendTime1Confirm">
            确定
          </wd-button>
        </view>
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" plain @click="handleReset">
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
import { getNavbarHeight } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const formData = reactive({
  mobile: undefined as string | undefined,
  sendStatus: -1,
  receiveStatus: -1,
  sendTime: [undefined, undefined] as [number | undefined, number | undefined],
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.mobile) {
    conditions.push(`手机号:${formData.mobile}`)
  }
  if (formData.sendStatus !== -1) {
    conditions.push(`发送:${getDictLabel(DICT_TYPE.SYSTEM_SMS_SEND_STATUS, formData.sendStatus)}`)
  }
  if (formData.receiveStatus !== -1) {
    conditions.push(`接收:${getDictLabel(DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS, formData.receiveStatus)}`)
  }
  if (formData.sendTime?.[0] && formData.sendTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.sendTime[0])}~${formatDate(formData.sendTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索短信日志'
})

// 时间范围选择器状态
const visibleSendTime = ref<[boolean, boolean]>([false, false])
const tempSendTime = ref<[number, number]>([Date.now(), Date.now()])

/** 发送时间[0]确认 */
function handleSendTime0Confirm() {
  formData.sendTime = [tempSendTime.value[0], formData.sendTime?.[1]]
  visibleSendTime.value[0] = false
}

/** 发送时间[1]确认 */
function handleSendTime1Confirm() {
  formData.sendTime = [formData.sendTime?.[0], tempSendTime.value[1]]
  visibleSendTime.value[1] = false
}

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    mobile: formData.mobile || undefined,
    sendStatus: formData.sendStatus === -1 ? undefined : formData.sendStatus,
    receiveStatus: formData.receiveStatus === -1 ? undefined : formData.receiveStatus,
    sendTime: formatDateRange(formData.sendTime),
  })
}

/** 重置 */
function handleReset() {
  formData.mobile = undefined
  formData.sendStatus = -1
  formData.receiveStatus = -1
  formData.sendTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
