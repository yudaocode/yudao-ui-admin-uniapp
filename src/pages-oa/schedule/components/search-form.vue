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
          标题
        </view>
        <wd-input
          v-model="formData.title"
          placeholder="请输入标题"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          日程类型
        </view>
        <yd-search-picker
          v-model="formData.type"
          :columns="getIntDictOptions(DICT_TYPE.OA_SCHEDULE_TYPE)"
          all-option
          all-label="全部类型"
          placeholder="请选择日程类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          优先级
        </view>
        <yd-search-picker
          v-model="formData.priority"
          :columns="getIntDictOptions(DICT_TYPE.OA_PRIORITY)"
          all-option
          all-label="全部优先级"
          placeholder="请选择优先级"
        />
      </view>
      <yd-search-date-range v-if="showStartTime" v-model="formData.startTime" label="开始时间" />
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

const props = withDefaults(defineProps<{
  showStartTime?: boolean // 是否展示开始时间筛选（日历页按月份查重叠日程，隐藏该项）
}>(), {
  showStartTime: true,
})

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  title: undefined as string | undefined,
  type: undefined as number | undefined,
  priority: undefined as number | undefined,
  startTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.title) {
    conditions.push(`标题:${formData.title}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.OA_SCHEDULE_TYPE, formData.type)}`)
  }
  if (formData.priority !== undefined) {
    conditions.push(`优先级:${getDictLabel(DICT_TYPE.OA_PRIORITY, formData.priority)}`)
  }
  if (formData.startTime?.[0] && formData.startTime?.[1]) {
    conditions.push(`开始:${formatDate(formData.startTime[0])}~${formatDate(formData.startTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索日程'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    title: formData.title || undefined,
    type: formData.type,
    priority: formData.priority,
    startTime: formatDateRange(formData.startTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.title = undefined
  formData.type = undefined
  formData.priority = undefined
  formData.startTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
