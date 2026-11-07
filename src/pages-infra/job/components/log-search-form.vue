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
          任务编号
        </view>
        <wd-input
          v-model="formData.jobId"
          placeholder="请输入任务编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          处理器名称
        </view>
        <wd-input
          v-model="formData.handlerName"
          placeholder="请输入处理器名称"
          clearable
        />
      </view>
      <yd-search-picker v-model="formData.status" label="执行状态" :dict-type="DICT_TYPE.INFRA_JOB_LOG_STATUS" all-option />
      <yd-search-date-range v-model="formData.beginTime" label="开始时间" />
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
import { computed, reactive, ref, watch } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const props = defineProps<{
  jobId?: number
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  jobId: undefined as number | undefined,
  handlerName: undefined as string | undefined,
  status: undefined as number | undefined,
  beginTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.jobId) {
    conditions.push(`任务编号:${formData.jobId}`)
  }
  if (formData.handlerName) {
    conditions.push(`处理器:${formData.handlerName}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.INFRA_JOB_LOG_STATUS, formData.status)}`)
  }
  if (formData.beginTime?.[0] && formData.beginTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.beginTime[0])}~${formatDate(formData.beginTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索调度日志'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  const range = formatDateRange(formData.beginTime)
  emit('search', {
    jobId: formData.jobId || undefined,
    handlerName: formData.handlerName || undefined,
    status: formData.status,
    beginTime: range?.[0],
    endTime: range?.[1],
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.jobId = undefined
  formData.handlerName = undefined
  formData.status = undefined
  formData.beginTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}

/** 监听外部 jobId 变化 */
watch(
  () => props.jobId,
  (val) => {
    formData.jobId = val
  },
  { immediate: true },
)
</script>
