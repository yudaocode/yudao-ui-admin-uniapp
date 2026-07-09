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
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="物料" placeholder="请选择物料" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          批次号
        </view>
        <wd-input
          v-model="formData.batchCode"
          placeholder="请输入批次号"
          clearable
        />
      </view>
      <WarehouseSearchPicker
        ref="warehouseSearchPickerRef"
        v-model="formData.warehouseId"
        label="仓库"
        placeholder="请选择仓库"
        @change="handleWarehouseChange"
      />
      <WarehouseLocationSearchPicker
        ref="locationSearchPickerRef"
        v-model="formData.locationId"
        label="库区"
        :warehouse-id="formData.warehouseId"
      />
      <yd-search-picker v-model="formData.frozen" label="是否冻结" :columns="frozenOptions" all-option />
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
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'
import WarehouseSearchPicker from '@/pages-mes/wm/warehouse/components/warehouse-search-picker.vue'
import WarehouseLocationSearchPicker from '@/pages-mes/wm/warehouse/location/components/warehouse-location-search-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

interface MaterialStockSearchFormData {
  itemId?: number
  batchCode?: string
  warehouseId?: number
  locationId?: number
  frozen?: boolean | -1
}

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 物料搜索选择器
const warehouseSearchPickerRef = ref<InstanceType<typeof WarehouseSearchPicker>>() // 仓库搜索选择器
const locationSearchPickerRef = ref<InstanceType<typeof WarehouseLocationSearchPicker>>() // 库区搜索选择器
const formData = reactive<MaterialStockSearchFormData>({}) // 搜索表单数据
const frozenOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
]

const frozenDisplayValue = computed(() => {
  if (formData.frozen === true) {
    return '是'
  }
  if (formData.frozen === false) {
    return '否'
  }
  return ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.itemId) {
    conditions.push(`物料:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  if (formData.batchCode) {
    conditions.push(`批次号:${formData.batchCode}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${warehouseSearchPickerRef.value?.format(formData.warehouseId) || formData.warehouseId}`)
  }
  if (formData.locationId) {
    conditions.push(`库区:${locationSearchPickerRef.value?.format(formData.locationId) || formData.locationId}`)
  }
  if (frozenDisplayValue.value) {
    conditions.push(`冻结:${frozenDisplayValue.value}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库存台账'
})

/** 选择仓库 */
function handleWarehouseChange() {
  formData.locationId = undefined
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    frozen: formData.frozen === -1 ? undefined : formData.frozen,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.itemId = undefined
  formData.batchCode = undefined
  formData.warehouseId = undefined
  formData.locationId = undefined
  formData.frozen = undefined
  visible.value = false
  emit('reset')
}
</script>
