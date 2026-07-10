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
          任务名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入任务名称"
          clearable
        />
      </view>
      <ProcessDefinitionSearchPicker ref="processDefinitionPickerRef" v-model="formData.processDefinitionKey" />
      <CategorySearchPicker ref="categoryPickerRef" v-model="formData.category" />
      <yd-search-picker ref="statusPickerRef" v-model="formData.status" label="审批状态" :dict-type="DICT_TYPE.BPM_TASK_STATUS" all-option />
      <yd-search-date-range v-model="formData.createTime" label="发起时间" />
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
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import { computed, reactive, ref } from 'vue'
import CategorySearchPicker from '@/pages-bpm/category/components/category-search-picker.vue'
import ProcessDefinitionSearchPicker from '@/pages-bpm/definition/components/process-definition-search-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const formData = reactive({
  name: undefined as string | undefined,
  processDefinitionKey: undefined as string | undefined,
  category: undefined as string | undefined,
  status: -1, // -1 表示全部
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据
const visible = ref(false) // 搜索弹窗显示状态
const processDefinitionPickerRef = ref<InstanceType<typeof ProcessDefinitionSearchPicker>>()
const categoryPickerRef = ref<InstanceType<typeof CategorySearchPicker>>()
const statusPickerRef = ref<YdSearchPickerExpose>()

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.processDefinitionKey) {
    conditions.push(`流程:${processDefinitionPickerRef.value?.format(formData.processDefinitionKey) || formData.processDefinitionKey}`)
  }
  if (formData.category) {
    conditions.push(`分类:${categoryPickerRef.value?.format(formData.category) || formData.category}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${statusPickerRef.value?.format(formData.status) || formData.status}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索已办任务'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    status: formData.status === -1 ? undefined : formData.status,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.processDefinitionKey = undefined
  formData.category = undefined
  formData.status = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
