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
          移库单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入移库单号" clearable />
      </view>
      <yd-search-picker v-model="formData.status" label="单据状态" :dict-type="DICT_TYPE.WMS_ORDER_STATUS" all-option />
      <WarehouseSearchPicker ref="sourceWarehousePickerRef" v-model="formData.sourceWarehouseId" label="来源仓库" placeholder="请选择来源仓库" />
      <WarehouseSearchPicker ref="targetWarehousePickerRef" v-model="formData.targetWarehouseId" label="目标仓库" placeholder="请选择目标仓库" />
      <yd-search-date-range v-model="formData.orderTime" label="单据日期" />
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
const sourceWarehousePickerRef = ref<InstanceType<typeof WarehouseSearchPicker>>()
const targetWarehousePickerRef = ref<InstanceType<typeof WarehouseSearchPicker>>()
const formData = reactive({
  no: undefined as string | undefined,
  status: undefined as number | undefined,
  sourceWarehouseId: undefined as number | undefined,
  targetWarehouseId: undefined as number | undefined,
  orderTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, formData.status)}`)
  }
  if (formData.sourceWarehouseId) {
    conditions.push(`来源:${sourceWarehousePickerRef.value?.format(formData.sourceWarehouseId) || formData.sourceWarehouseId}`)
  }
  if (formData.targetWarehouseId) {
    conditions.push(`目标:${targetWarehousePickerRef.value?.format(formData.targetWarehouseId) || formData.targetWarehouseId}`)
  }
  if (formData.orderTime?.[0] && formData.orderTime?.[1]) {
    conditions.push(`日期:${formatDate(formData.orderTime[0])}~${formatDate(formData.orderTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索移库单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    orderTime: formatDateRange(formData.orderTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.status = undefined
  formData.sourceWarehouseId = undefined
  formData.targetWarehouseId = undefined
  formData.orderTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
