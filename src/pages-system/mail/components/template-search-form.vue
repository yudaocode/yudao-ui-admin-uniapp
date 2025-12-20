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
          模板编码
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入模板编码"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          模板名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入模板名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          开启状态
        </view>
        <wd-radio-group v-model="formData.status" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
          创建时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="visibleCreateTime[0] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.createTime?.[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="visibleCreateTime[1] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.createTime?.[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker-view v-if="visibleCreateTime[0]" v-model="tempCreateTime[0]" type="date" />
        <view v-if="visibleCreateTime[0]" class="yd-search-form-date-range-actions">
          <wd-button size="small" plain @click="visibleCreateTime[0] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime0Confirm">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view v-if="visibleCreateTime[1]" v-model="tempCreateTime[1]" type="date" />
        <view v-if="visibleCreateTime[1]" class="yd-search-form-date-range-actions">
          <wd-button size="small" plain @click="visibleCreateTime[1] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime1Confirm">
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
import { getSimpleMailAccountList } from '@/api/system/mail/account'
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
  status: -1,
  code: undefined as string | undefined,
  name: undefined as string | undefined,
  accountId: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
})

/** 邮箱账号列表 */
const accountList = ref<{ id?: number, mail: string }[]>([])

/** 邮箱账号选项 */
const accountOptions = computed(() => {
  return accountList.value.map(item => ({
    value: item.id,
    label: item.mail,
  }))
})

/** 获取邮箱账号名称 */
function getAccountMail(accountId?: number) {
  return accountList.value.find(item => item.id === accountId)?.mail
}

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.accountId) {
    conditions.push(`账号:${getAccountMail(formData.accountId) || formData.accountId}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索邮件模板'
})

// 时间范围选择器状态
const visibleCreateTime = ref<[boolean, boolean]>([false, false])
const tempCreateTime = ref<[number, number]>([Date.now(), Date.now()])

/** 创建时间[0]确认 */
function handleCreateTime0Confirm() {
  formData.createTime = [tempCreateTime.value[0], formData.createTime?.[1]]
  visibleCreateTime.value[0] = false
}

/** 创建时间[1]确认 */
function handleCreateTime1Confirm() {
  formData.createTime = [formData.createTime?.[0], tempCreateTime.value[1]]
  visibleCreateTime.value[1] = false
}

/** 搜索 */
function handleSearch() {
  visible.value = false
  const dateRange = formatDateRange(formData.createTime)
  emit('search', {
    status: formData.status === -1 ? undefined : formData.status,
    code: formData.code || undefined,
    name: formData.name || undefined,
    accountId: formData.accountId || undefined,
    beginTime: dateRange?.[0],
    endTime: dateRange?.[1],
  })
}

/** 重置 */
function handleReset() {
  formData.status = -1
  formData.code = undefined
  formData.name = undefined
  formData.accountId = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  try {
    accountList.value = await getSimpleMailAccountList()
  } catch {
    accountList.value = []
  }
})
</script>
