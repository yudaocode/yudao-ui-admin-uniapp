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
          用户编号
        </view>
        <wd-input
          v-model="formData.userId"
          placeholder="请输入用户编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户类型
        </view>
        <wd-radio-group v-model="formData.userType" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.USER_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
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
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_MAIL_SEND_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <MailAccountSearchPicker ref="accountPickerRef" v-model="formData.accountId" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          模板编号
        </view>
        <wd-input
          v-model="formData.templateId"
          placeholder="请输入模板编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          接收邮箱
        </view>
        <wd-input
          v-model="formData.toMail"
          placeholder="请输入接收邮箱"
          clearable
        />
      </view>
      <yd-search-date-range v-model="formData.sendTime" label="发送时间" />
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
import MailAccountSearchPicker from '../../account/components/search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const formData = reactive({
  sendTime: [undefined, undefined] as [number | undefined, number | undefined],
  userId: undefined as number | undefined,
  userType: -1,
  sendStatus: -1,
  accountId: undefined as number | undefined,
  templateId: undefined as number | undefined,
  toMail: undefined as string | undefined,
}) // 搜索表单数据
const visible = ref(false) // 搜索弹窗显示状态

const accountPickerRef = ref<InstanceType<typeof MailAccountSearchPicker>>() // 邮箱账号选择器

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.sendTime?.[0] && formData.sendTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.sendTime[0])}~${formatDate(formData.sendTime[1])}`)
  }
  if (formData.userId) {
    conditions.push(`用户:${formData.userId}`)
  }
  if (formData.userType !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.USER_TYPE, formData.userType)}`)
  }
  if (formData.sendStatus !== -1) {
    conditions.push(`发送:${getDictLabel(DICT_TYPE.SYSTEM_MAIL_SEND_STATUS, formData.sendStatus)}`)
  }
  if (formData.accountId) {
    conditions.push(`账号:${accountPickerRef.value?.format(formData.accountId) || formData.accountId}`)
  }
  if (formData.templateId) {
    conditions.push(`模板:${formData.templateId}`)
  }
  if (formData.toMail) {
    conditions.push(`接收:${formData.toMail}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索邮件日志'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    sendTime: formatDateRange(formData.sendTime),
    userId: formData.userId,
    userType: formData.userType === -1 ? undefined : formData.userType,
    sendStatus: formData.sendStatus === -1 ? undefined : formData.sendStatus,
    accountId: formData.accountId || undefined,
    templateId: formData.templateId || undefined,
    toMail: formData.toMail || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.sendTime = [undefined, undefined]
  formData.userId = undefined
  formData.userType = -1
  formData.sendStatus = -1
  formData.accountId = undefined
  formData.templateId = undefined
  formData.toMail = undefined
  visible.value = false
  emit('reset')
}
</script>
