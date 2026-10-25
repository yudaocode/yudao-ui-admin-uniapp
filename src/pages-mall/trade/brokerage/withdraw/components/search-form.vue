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
        <wd-input v-model="formData.userId" type="number" placeholder="请输入用户编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          账号
        </view>
        <wd-input v-model="formData.userAccount" placeholder="请输入账号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          真实姓名
        </view>
        <wd-input v-model="formData.userName" placeholder="请输入真实姓名" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          提现类型
        </view>
        <wd-radio-group v-model="formData.type" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.BROKERAGE_WITHDRAW_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          提现银行
        </view>
        <wd-radio-group v-model="formData.bankName" type="button">
          <wd-radio value="">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getStrDictOptions(DICT_TYPE.BROKERAGE_BANK_NAME)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          提现状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.BROKERAGE_WITHDRAW_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <yd-search-date-range v-model="formData.createTime" label="申请时间" />
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
import { parseId } from '@/utils/id'

import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  userId: undefined as string | undefined,
  userAccount: undefined as string | undefined,
  userName: undefined as string | undefined,
  type: -1,
  bankName: '',
  status: -1,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.userId) {
    conditions.push(`用户:${formData.userId}`)
  }
  if (formData.userAccount) {
    conditions.push(`账号:${formData.userAccount}`)
  }
  if (formData.userName) {
    conditions.push(`姓名:${formData.userName}`)
  }
  if (formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.BROKERAGE_WITHDRAW_TYPE, formData.type)}`)
  }
  if (formData.bankName) {
    conditions.push(`银行:${getDictLabel(DICT_TYPE.BROKERAGE_BANK_NAME, formData.bankName)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.BROKERAGE_WITHDRAW_STATUS, formData.status)}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索佣金提现'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    userId: formData.userId ? parseId(formData.userId) : undefined,
    userAccount: formData.userAccount || undefined,
    userName: formData.userName || undefined,
    type: formData.type === -1 ? undefined : formData.type,
    bankName: formData.bankName || undefined,
    status: formData.status === -1 ? undefined : formData.status,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.userId = undefined
  formData.userAccount = undefined
  formData.userName = undefined
  formData.type = -1
  formData.bankName = ''
  formData.status = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
