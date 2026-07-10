<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          合同编号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入合同编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          合同名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入合同名称" clearable />
      </view>
      <CustomerSearchPicker ref="customerPickerRef" v-model="formData.customerId" />
      <yd-search-date-range v-model="formData.orderDate" label="下单日期" />
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
import { formatDate, formatDateRange } from '@/utils/date'
import CustomerSearchPicker from '@/pages-crm/customer/components/customer-search-picker.vue'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  no: undefined,
  name: undefined,
  customerId: undefined,
  orderDate: ['', ''],
}) // 搜索表单数据
const customerPickerRef = ref<InstanceType<typeof CustomerSearchPicker>>() // 客户选择器
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`编号:${formData.no}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.customerId) {
    conditions.push(`客户:${customerPickerRef.value?.format(formData.customerId) || formData.customerId}`)
  }
  if (formData.orderDate[0] && formData.orderDate[1]) {
    conditions.push(`下单:${formatDate(formData.orderDate[0])}~${formatDate(formData.orderDate[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索合同'
}) // 搜索框占位：回显已选条件

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no,
    name: formData.name,
    customerId: formData.customerId,
    orderDate: formatDateRange([formData.orderDate[0], formData.orderDate[1]]),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.name = undefined
  formData.customerId = undefined
  formData.orderDate = ['', '']
  visible.value = false
  emit('reset')
}
</script>
