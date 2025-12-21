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
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          执行状态
        </view>
        <wd-radio-group v-model="formData.status" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.INFRA_JOB_LOG_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          开始时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="visibleBeginTime[0] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.beginTime?.[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="visibleBeginTime[1] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.beginTime?.[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker-view v-if="visibleBeginTime[0]" v-model="tempBeginTime[0]" type="date" />
        <view v-if="visibleBeginTime[0]" class="yd-search-form-date-range-actions">
          <wd-button size="small" plain @click="visibleBeginTime[0] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleBeginTime0Confirm">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view v-if="visibleBeginTime[1]" v-model="tempBeginTime[1]" type="date" />
        <view v-if="visibleBeginTime[1]" class="yd-search-form-date-range-actions">
          <wd-button size="small" plain @click="visibleBeginTime[1] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleBeginTime1Confirm">
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
import { computed, reactive, ref, watch } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getNavbarHeight } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const props = defineProps<{
  jobId?: number
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const formData = reactive({
  jobId: undefined as number | undefined,
  handlerName: undefined as string | undefined,
  status: -1, // -1 表示全部
  beginTime: [undefined, undefined] as [number | undefined, number | undefined],
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.jobId) {
    conditions.push(`任务编号:${formData.jobId}`)
  }
  if (formData.handlerName) {
    conditions.push(`处理器:${formData.handlerName}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.INFRA_JOB_LOG_STATUS, formData.status)}`)
  }
  if (formData.beginTime?.[0] && formData.beginTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.beginTime[0])}~${formatDate(formData.beginTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索调度日志'
})

// 时间范围选择器状态
const visibleBeginTime = ref<[boolean, boolean]>([false, false])
const tempBeginTime = ref<[number, number]>([Date.now(), Date.now()])

/** 开始时间[0]确认 */
function handleBeginTime0Confirm() {
  formData.beginTime = [tempBeginTime.value[0], formData.beginTime?.[1]]
  visibleBeginTime.value[0] = false
}

/** 开始时间[1]确认 */
function handleBeginTime1Confirm() {
  formData.beginTime = [formData.beginTime?.[0], tempBeginTime.value[1]]
  visibleBeginTime.value[1] = false
}

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    jobId: formData.jobId || undefined,
    handlerName: formData.handlerName || undefined,
    status: formData.status === -1 ? undefined : formData.status,
    beginTime: formatDateRange(formData.beginTime),
  })
}

/** 重置 */
function handleReset() {
  formData.jobId = undefined
  formData.handlerName = undefined
  formData.status = -1
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
