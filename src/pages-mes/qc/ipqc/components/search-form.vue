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
          检验单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入检验单编号" clearable />
      </view>
      <yd-search-picker v-model="formData.type" label="检验类型" :dict-type="DICT_TYPE.MES_IPQC_TYPE" all-option />
      <WorkOrderSearchPicker ref="workOrderSearchPickerRef" v-model="formData.workOrderId" label="生产工单" placeholder="请选择生产工单" />
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="产品物料" placeholder="请选择产品物料" title="选择产品物料" />
      <yd-search-picker v-model="formData.checkResult" label="检测结果" :dict-type="DICT_TYPE.MES_QC_CHECK_RESULT" all-option />
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
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'
import WorkOrderSearchPicker from '@/pages-mes/pro/workorder/components/workorder-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const workOrderSearchPickerRef = ref<InstanceType<typeof WorkOrderSearchPicker>>() // 工单搜索选择器
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 物料搜索选择器
const formData = reactive({
  code: '',
  type: undefined,
  workOrderId: undefined,
  itemId: undefined,
  checkResult: undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.type != null) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_IPQC_TYPE, formData.type) || formData.type}`)
  }
  if (formData.workOrderId != null) {
    conditions.push(`工单:${workOrderSearchPickerRef.value?.format(formData.workOrderId) || formData.workOrderId}`)
  }
  if (formData.itemId != null) {
    conditions.push(`物料:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  if (formData.checkResult != null) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.MES_QC_CHECK_RESULT, formData.checkResult) || formData.checkResult}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索过程检验单（IPQC）'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    type: formData.type,
    workOrderId: formData.workOrderId,
    itemId: formData.itemId,
    checkResult: formData.checkResult,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.type = undefined
  formData.workOrderId = undefined
  formData.itemId = undefined
  formData.checkResult = undefined
  visible.value = false
  emit('reset')
}
</script>
