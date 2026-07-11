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
          应用名
        </view>
        <wd-input
          v-model="formData.applicationName"
          placeholder="请输入应用名"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          请求地址
        </view>
        <wd-input
          v-model="formData.requestUrl"
          placeholder="请输入请求地址"
          clearable
        />
      </view>
      <yd-search-picker
        v-model="formData.userType"
        label="用户类型"
        :dict-type="DICT_TYPE.USER_TYPE"
        all-option
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          执行时长
        </view>
        <wd-input
          v-model.number="formData.duration"
          type="number"
          placeholder="请输入执行时长（毫秒）"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          结果码
        </view>
        <wd-input
          v-model.number="formData.resultCode"
          type="number"
          placeholder="请输入结果码"
          clearable
        />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="访问时间" />
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
  applicationName: undefined as string | undefined,
  requestUrl: undefined as string | undefined,
  userType: undefined as number | undefined,
  duration: undefined as number | undefined,
  resultCode: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.userId) {
    conditions.push(`用户编号:${formData.userId}`)
  }
  if (formData.applicationName) {
    conditions.push(`应用名:${formData.applicationName}`)
  }
  if (formData.requestUrl) {
    conditions.push(`地址:${formData.requestUrl}`)
  }
  if (formData.userType !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.USER_TYPE, formData.userType)}`)
  }
  if (formData.duration != null) {
    conditions.push(`时长:${formData.duration}ms`)
  }
  if (formData.resultCode != null) {
    conditions.push(`结果码:${formData.resultCode}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索日志'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    userId: formData.userId,
    applicationName: formData.applicationName,
    requestUrl: formData.requestUrl,
    userType: formData.userType,
    duration: formData.duration,
    resultCode: formData.resultCode,
    beginTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.userId = undefined
  formData.applicationName = undefined
  formData.requestUrl = undefined
  formData.userType = undefined
  formData.duration = undefined
  formData.resultCode = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
