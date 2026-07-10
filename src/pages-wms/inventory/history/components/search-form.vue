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
        <view class="yd-search-form-label">
          单据编号
        </view>
        <wd-input v-model="formData.orderNo" placeholder="请输入单据编号" clearable />
      </view>
      <yd-search-picker v-model="formData.orderType" label="单据类型" :dict-type="DICT_TYPE.WMS_ORDER_TYPE" all-option />
      <WarehouseSearchPicker ref="warehousePickerRef" v-model="formData.warehouseId" label="仓库" placeholder="请选择仓库" />
      <yd-search-date-range v-model="formData.createTime" label="操作时间" />
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
import WarehouseSearchPicker from '@/pages-wms/md/warehouse/components/warehouse-search-picker.vue'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const warehousePickerRef = ref<InstanceType<typeof WarehouseSearchPicker>>()
const formData = reactive({
  itemName: undefined as string | undefined,
  itemCode: undefined as string | undefined,
  skuName: undefined as string | undefined,
  skuCode: undefined as string | undefined,
  orderNo: undefined as string | undefined,
  orderType: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.itemName) {
    conditions.push(`商品:${formData.itemName}`)
  }
  if (formData.itemCode) {
    conditions.push(`商品编号:${formData.itemCode}`)
  }
  if (formData.skuName) {
    conditions.push(`规格:${formData.skuName}`)
  }
  if (formData.skuCode) {
    conditions.push(`规格编号:${formData.skuCode}`)
  }
  if (formData.orderNo) {
    conditions.push(`单据:${formData.orderNo}`)
  }
  if (formData.orderType !== undefined && formData.orderType !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, formData.orderType)}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${warehousePickerRef.value?.format(formData.warehouseId) || formData.warehouseId}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库存流水'
})

/** 清理全部选项值 */
function cleanPickerValue(value?: number) {
  return value === -1 ? undefined : value
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    orderType: cleanPickerValue(formData.orderType),
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.itemName = undefined
  formData.itemCode = undefined
  formData.skuName = undefined
  formData.skuCode = undefined
  formData.orderNo = undefined
  formData.orderType = undefined
  formData.warehouseId = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
