<template>
  <!-- 搜索框入口 -->
  <view class="relative" @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
    <view class="absolute inset-0 z-1" />
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
          退货单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入退货单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退货单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入退货单名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          销售订单号
        </view>
        <wd-input v-model="formData.salesOrderCode" placeholder="请输入销售订单号" clearable />
      </view>
      <ClientSearchPicker ref="clientSearchPickerRef" v-model="formData.clientId" label="客户" placeholder="请选择客户" />
      <yd-search-picker
        ref="statusSearchPickerRef"
        v-model="formData.status"
        label="单据状态"
        :dict-type="DICT_TYPE.MES_WM_RETURN_SALES_STATUS"
        all-option
      />
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
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ClientSearchPicker from '@/pages-mes/md/client/components/client-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const clientSearchPickerRef = ref<InstanceType<typeof ClientSearchPicker>>() // 客户搜索选择器
const statusSearchPickerRef = ref<YdSearchPickerExpose>() // 状态搜索选择器
const formData = reactive<Record<string, any>>({
  code: undefined,
  name: undefined,
  salesOrderCode: undefined,
  clientId: undefined,
  status: undefined,
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
  if (formData.salesOrderCode) {
    conditions.push(`销售订单:${formData.salesOrderCode}`)
  }
  if (formData.clientId != null) {
    conditions.push(`客户:${clientSearchPickerRef.value?.format(formData.clientId) || formData.clientId}`)
  }
  if (formData.status != null && formData.status !== -1) {
    conditions.push(`状态:${statusSearchPickerRef.value?.format(formData.status) || formData.status}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索销售退货'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.salesOrderCode = undefined
  formData.status = undefined
  formData.clientId = undefined
  visible.value = false
  emit('reset')
}
</script>
