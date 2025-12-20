<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <wd-popup v-model="visible" position="top" @close="visible = false">
    <view class="yd-search-form-container" :style="{ paddingTop: `${getNavbarHeight()}px` }">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户编号
        </view>
        <wd-input v-model="formData.userId" placeholder="请输入用户编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户类型
        </view>
        <wd-radio-group v-model="formData.userType" shape="button">
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
        <wd-radio-group v-model="formData.sendStatus" shape="button">
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
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          邮箱账号
        </view>
        <wd-picker
          v-model="formData.accountId"
          :columns="accountOptions"
          placeholder="请选择邮箱账号"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          模板编号
        </view>
        <wd-input v-model="formData.templateId" placeholder="请输入模板编号" clearable />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { getSimpleMailAccountList } from '@/api/system/mail/account/index'
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
  sendTime: [undefined, undefined] as [number | undefined, number | undefined],
  userId: undefined as number | undefined,
  userType: -1,
  sendStatus: -1,
  accountId: undefined as number | undefined,
  templateId: undefined as number | undefined,
})

const accountList = ref<{ id?: number, mail: string }[]>([])
const accountOptions = computed(() => {
  return accountList.value.map(item => ({
    value: item.id,
    label: item.mail,
  }))
})
function getAccountMail(accountId?: number) {
  return accountList.value.find(item => item.id === accountId)?.mail
}

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
    conditions.push(`账号:${getAccountMail(formData.accountId) || formData.accountId}`)
  }
  if (formData.templateId) {
    conditions.push(`模板:${formData.templateId}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索邮件日志'
})

const visibleSendTime = ref<[boolean, boolean]>([false, false])
const tempSendTime = ref<[number, number]>([Date.now(), Date.now()])

function handleSendTime0Confirm() {
  formData.sendTime = [tempSendTime.value[0], formData.sendTime?.[1]]
  visibleSendTime.value[0] = false
}

function handleSendTime1Confirm() {
  formData.sendTime = [formData.sendTime?.[0], tempSendTime.value[1]]
  visibleSendTime.value[1] = false
}

function handleSearch() {
  visible.value = false
  const dateRange = formatDateRange(formData.sendTime)
  emit('search', {
    beginTime: dateRange?.[0],
    endTime: dateRange?.[1],
    userId: formData.userId,
    userType: formData.userType === -1 ? undefined : formData.userType,
    sendStatus: formData.sendStatus === -1 ? undefined : formData.sendStatus,
    accountId: formData.accountId || undefined,
    templateId: formData.templateId || undefined,
  })
}

function handleReset() {
  formData.sendTime = [undefined, undefined]
  formData.userId = undefined
  formData.userType = -1
  formData.sendStatus = -1
  formData.accountId = undefined
  formData.templateId = undefined
  visible.value = false
  emit('reset')
}

onMounted(async () => {
  try {
    accountList.value = await getSimpleMailAccountList()
  } catch {
    accountList.value = []
  }
})
</script>
