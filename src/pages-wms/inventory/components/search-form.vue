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
      <yd-search-picker v-model="formData.type" label="统计维度" :columns="typeOptions" />
      <WarehousePicker v-model="formData.warehouseId" label="仓库" placeholder="请选择仓库" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商品名称
        </view>
        <wd-input v-model="formData.itemName" placeholder="请输入商品名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商品编号
        </view>
        <wd-input v-model="formData.itemCode" placeholder="请输入商品编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          规格名称
        </view>
        <wd-input v-model="formData.skuName" placeholder="请输入规格名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          规格编号
        </view>
        <wd-input v-model="formData.skuCode" placeholder="请输入规格编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="flex items-center justify-between">
          <view class="yd-search-form-label">
            过滤零库存
          </view>
          <wd-switch v-model="formData.onlyPositiveQuantity" />
        </view>
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
import WarehousePicker from '@/pages-wms/md/warehouse/components/warehouse-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const typeOptions = [
  { label: '仓库', value: 'warehouse' },
  { label: '商品', value: 'item' },
] // 统计维度选项
const defaultType = typeOptions[0].value // 默认统计维度
const formData = reactive({
  type: defaultType,
  warehouseId: undefined as number | undefined,
  itemName: undefined as string | undefined,
  itemCode: undefined as string | undefined,
  skuName: undefined as string | undefined,
  skuCode: undefined as string | undefined,
  onlyPositiveQuantity: false,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  conditions.push(formData.type === typeOptions[1].value ? '维度:商品' : '维度:仓库')
  if (formData.warehouseId) {
    conditions.push('已选仓库')
  }
  if (formData.itemName) {
    conditions.push(`商品:${formData.itemName}`)
  }
  if (formData.itemCode) {
    conditions.push(`编号:${formData.itemCode}`)
  }
  if (formData.skuName) {
    conditions.push(`规格:${formData.skuName}`)
  }
  if (formData.skuCode) {
    conditions.push(`规格编号:${formData.skuCode}`)
  }
  if (formData.onlyPositiveQuantity) {
    conditions.push('过滤零库存')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库存'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    onlyPositiveQuantity: formData.onlyPositiveQuantity ? true : undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.type = defaultType
  formData.warehouseId = undefined
  formData.itemName = undefined
  formData.itemCode = undefined
  formData.skuName = undefined
  formData.skuCode = undefined
  formData.onlyPositiveQuantity = false
  visible.value = false
  emit('reset')
}
</script>
