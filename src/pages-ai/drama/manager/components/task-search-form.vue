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
      <yd-search-picker v-model="formData.type" label="任务类型" :dict-type="DICT_TYPE.AI_DRAMA_TASK_TYPE" all-option />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.AI_DRAMA_STATUS" all-option />
      <UserSearchPicker ref="userPickerRef" v-model="formData.userId" label="用户" placeholder="请选择用户" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          项目编号
        </view>
        <wd-input v-model="formData.projectId" type="number" placeholder="请输入项目编号" clearable />
      </view>
      <yd-search-picker
        v-model="formData.modelId"
        label="模型"
        :columns="models"
        label-key="name"
        value-key="id"
        all-option
      />
      <view class="mb-16rpx text-22rpx text-[#999]">
        按模型筛选时，不含成片合成（合成不使用模型）
      </view>
      <yd-search-date-range v-model="formData.updateTime" label="更新时间" />
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
import type { AiModel } from '@/api/ai/model/model'
import { computed, reactive, ref } from 'vue'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const props = defineProps<{
  models: AiModel[] // 模型选项
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const userPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 用户选择器引用
const formData = reactive({ // 搜索表单数据
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  userId: undefined as number | undefined,
  projectId: undefined as string | undefined,
  modelId: undefined as number | undefined,
  updateTime: [undefined, undefined] as [number | undefined, number | undefined],
})
const placeholder = computed(() => { // 搜索条件摘要
  const conditions: string[] = []
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.AI_DRAMA_TASK_TYPE, formData.type)}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.AI_DRAMA_STATUS, formData.status)}`)
  }
  if (formData.userId) {
    conditions.push(`用户:${userPickerRef.value?.format(formData.userId) || formData.userId}`)
  }
  if (formData.projectId) {
    conditions.push(`项目:${formData.projectId}`)
  }
  if (formData.modelId !== undefined) {
    conditions.push(`模型:${props.models.find(item => item.id === formData.modelId)?.name || formData.modelId}`)
  }
  if (formData.updateTime[0] && formData.updateTime[1]) {
    conditions.push(`时间:${formatDate(formData.updateTime[0])}~${formatDate(formData.updateTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索生成任务'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    type: formData.type,
    status: formData.status,
    userId: formData.userId,
    projectId: formData.projectId ? Number(formData.projectId) : undefined,
    modelId: formData.modelId,
    updateTime: formatDateRange(formData.updateTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.type = undefined
  formData.status = undefined
  formData.userId = undefined
  formData.projectId = undefined
  formData.modelId = undefined
  formData.updateTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
