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
          退料单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入退料单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退料单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入退料单名称" clearable />
      </view>
      <WorkOrderSearchPicker ref="workOrderSearchPickerRef" v-model="formData.workOrderId" label="生产工单" placeholder="请选择生产工单" />
      <yd-search-picker v-model="formData.type" label="退料类型" :dict-type="DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE" all-option />
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
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import WorkOrderSearchPicker from '@/pages-mes/pro/workorder/components/workorder-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const workOrderSearchPickerRef = ref<InstanceType<typeof WorkOrderSearchPicker>>() // 工单搜索选择器
const formData = reactive({
  code: '',
  name: '',
  workOrderId: undefined,
  type: undefined,
}) // 搜索表单数据
/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.workOrderId != null) {
    conditions.push(`工单:${workOrderSearchPickerRef.value?.format(formData.workOrderId) || formData.workOrderId}`)
  }
  if (formData.type != null) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE, formData.type)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索生产退料'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    workOrderId: formData.workOrderId,
    type: formData.type,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.workOrderId = undefined
  formData.type = undefined
  visible.value = false
  emit('reset')
}
</script>
