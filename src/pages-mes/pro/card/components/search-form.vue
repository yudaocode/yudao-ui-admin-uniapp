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
          流转卡编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入流转卡编码" clearable />
      </view>
      <WorkOrderSearchPicker ref="workOrderSearchPickerRef" v-model="formData.workOrderId" label="生产工单" placeholder="请选择生产工单" :confirmed-only="false" />
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="产品" placeholder="请选择产品" item-or-product="PRODUCT" title="选择产品" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          批次号
        </view>
        <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable />
      </view>
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
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'
import WorkOrderSearchPicker from '@/pages-mes/pro/workorder/components/workorder-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const workOrderSearchPickerRef = ref<InstanceType<typeof WorkOrderSearchPicker>>() // 工单搜索选择器
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 产品搜索选择器
const formData = reactive<Record<string, any>>({
  code: undefined,
  workOrderId: undefined,
  itemId: undefined,
  batchCode: undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.workOrderId) {
    conditions.push(`工单:${workOrderSearchPickerRef.value?.format(formData.workOrderId) || formData.workOrderId}`)
  }
  if (formData.itemId) {
    conditions.push(`产品:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  if (formData.batchCode) {
    conditions.push(`批次:${formData.batchCode}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索生产流转卡'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    workOrderId: formData.workOrderId,
    itemId: formData.itemId,
    batchCode: formData.batchCode || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.workOrderId = undefined
  formData.itemId = undefined
  formData.batchCode = undefined
  visible.value = false
  emit('reset')
}
</script>
