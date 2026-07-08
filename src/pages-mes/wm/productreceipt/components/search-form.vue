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
          入库单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入入库单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          入库单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入入库单名称" clearable />
      </view>
      <WorkOrderSearchPicker ref="workOrderSearchPickerRef" v-model="formData.workOrderId" label="生产工单" placeholder="请选择生产工单" :confirmed-only="false" />
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="产品物料" placeholder="请选择产品物料" item-or-product="PRODUCT" title="选择产品物料" />
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
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 物料搜索选择器
const formData = reactive<Record<string, any>>({
  code: undefined,
  name: undefined,
  workOrderId: undefined,
  itemId: undefined,
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
  if (formData.workOrderId) {
    conditions.push(`工单:${workOrderSearchPickerRef.value?.format(formData.workOrderId) || formData.workOrderId}`)
  }
  if (formData.itemId) {
    conditions.push(`产品:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索产品入库'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    workOrderId: formData.workOrderId,
    itemId: formData.itemId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.workOrderId = undefined
  formData.itemId = undefined
  visible.value = false
  emit('reset')
}
</script>
