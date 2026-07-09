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
      <yd-search-picker
        v-model="formData.warehouseId"
        label="仓库"
        :columns="warehouseOptions"
        label-key="name"
        value-key="id"
        placeholder="请选择仓库"
        all-option
        @update:model-value="handleWarehouseChange"
      />
      <yd-search-picker
        v-model="formData.locationId"
        label="库区"
        :columns="locationOptions"
        label-key="name"
        value-key="id"
        :placeholder="formData.warehouseId && formData.warehouseId !== -1 ? '请选择库区' : '请先选择仓库'"
        all-option
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
import type { WmWarehouse } from '@/api/mes/wm/warehouse'
import type { WmWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { computed, onMounted, reactive, ref } from 'vue'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'
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
const warehouseOptions = ref<WmWarehouse[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocation[]>([]) // 库区选项
const formData = reactive<MaterialStockSearchFormData>({}) // 搜索表单数据
const frozenOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
]

const warehouseDisplayValue = computed(() => warehouseOptions.value.find(item => item.id === formData.warehouseId)?.name || '')
const locationDisplayValue = computed(() => locationOptions.value.find(item => item.id === formData.locationId)?.name || '')
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
  if (warehouseDisplayValue.value) {
    conditions.push(`仓库:${warehouseDisplayValue.value}`)
  }
  if (locationDisplayValue.value) {
    conditions.push(`库区:${locationDisplayValue.value}`)
  }
  if (frozenDisplayValue.value) {
    conditions.push(`冻结:${frozenDisplayValue.value}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库存台账'
})

/** 加载仓库选项 */
async function loadWarehouseOptions() {
  warehouseOptions.value = await getWarehouseSimpleList() || []
}

/** 选择仓库 */
async function handleWarehouseChange(value?: number) {
  formData.warehouseId = value
  formData.locationId = undefined
  if (!value || value === -1) {
    locationOptions.value = []
    return
  }
  locationOptions.value = await getWarehouseLocationSimpleList(value) || []
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    warehouseId: formData.warehouseId === -1 ? undefined : formData.warehouseId,
    locationId: formData.locationId === -1 ? undefined : formData.locationId,
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
  locationOptions.value = []
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(() => {
  loadWarehouseOptions()
})
</script>
