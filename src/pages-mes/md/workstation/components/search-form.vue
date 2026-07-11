<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工作站编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入工作站编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工作站名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入工作站名称" clearable />
      </view>
      <WorkshopSearchPicker
        ref="workshopSearchPickerRef"
        v-model="formData.workshopId"
        label="所在车间"
        placeholder="请选择车间"
      />
      <ProcessSearchPicker
        ref="processSearchPickerRef"
        v-model="formData.processId"
        label="所属工序"
        placeholder="请选择工序"
      />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.COMMON_STATUS" all-option />
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
import ProcessSearchPicker from '@/pages-mes/pro/process/components/process-search-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import WorkshopSearchPicker from '../workshop/components/workshop-search-picker.vue'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()
const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  code: undefined as string | undefined,
  name: undefined as string | undefined,
  workshopId: undefined as number | undefined,
  processId: undefined as number | undefined,
  status: undefined,
}) // 搜索表单数据
const workshopSearchPickerRef = ref<InstanceType<typeof WorkshopSearchPicker>>() // 车间搜索选择器
const processSearchPickerRef = ref<InstanceType<typeof ProcessSearchPicker>>() // 工序搜索选择器

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.workshopId) {
    conditions.push(`车间:${workshopSearchPickerRef.value?.format(formData.workshopId) || formData.workshopId}`)
  }
  if (formData.processId) {
    conditions.push(`工序:${processSearchPickerRef.value?.format(formData.processId) || formData.processId}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索工作站'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    workshopId: formData.workshopId,
    processId: formData.processId,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.workshopId = undefined
  formData.processId = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
