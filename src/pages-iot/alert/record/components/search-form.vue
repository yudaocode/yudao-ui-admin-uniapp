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
      <AlertConfigSearchPicker ref="configPickerRef" v-model="formData.configId" />
      <yd-search-picker
        v-model="formData.configLevel"
        label="告警级别"
        :dict-type="DICT_TYPE.IOT_ALERT_LEVEL"
        all-option
      />
      <ProductSearchPicker ref="productPickerRef" v-model="formData.productId" />
      <DeviceSearchPicker ref="devicePickerRef" v-model="formData.deviceId" :product-id="formData.productId" />
      <yd-search-picker
        v-model="formData.processStatus"
        label="是否处理"
        :columns="processStatusOptions"
        all-option
      />
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
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
import { computed, reactive, ref, watch } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import AlertConfigSearchPicker from '@/pages-iot/alert/config/components/alert-config-search-picker.vue'
import DeviceSearchPicker from '@/pages-iot/device/device/components/device-search-picker.vue'
import ProductSearchPicker from '@/pages-iot/product/product/components/product-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const configPickerRef = ref<InstanceType<typeof AlertConfigSearchPicker>>() // 告警配置选择器
const productPickerRef = ref<InstanceType<typeof ProductSearchPicker>>() // 产品选择器
const devicePickerRef = ref<InstanceType<typeof DeviceSearchPicker>>() // 设备选择器
const processStatusOptions = [ // 处理状态选项
  { label: '已处理', value: true },
  { label: '未处理', value: false },
]
const formData = reactive({
  configId: undefined as number | undefined,
  configLevel: -1,
  productId: undefined as number | undefined,
  deviceId: undefined as number | undefined,
  processStatus: -1 as -1 | boolean,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据
const placeholder = computed(() => { // 搜索条件文案
  const conditions: string[] = []
  if (formData.configId) {
    conditions.push(`配置:${configPickerRef.value?.format(formData.configId) || formData.configId}`)
  }
  if (formData.configLevel !== -1) {
    conditions.push(`级别:${getDictLabel(DICT_TYPE.IOT_ALERT_LEVEL, formData.configLevel)}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${productPickerRef.value?.format(formData.productId) || formData.productId}`)
  }
  if (formData.deviceId !== undefined) {
    conditions.push(`设备:${devicePickerRef.value?.format(formData.deviceId) || formData.deviceId}`)
  }
  if (formData.processStatus !== -1) {
    conditions.push(`处理:${formData.processStatus ? '已处理' : '未处理'}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索告警记录'
})

/** 切换产品时清空已选设备 */
watch(() => formData.productId, () => {
  formData.deviceId = undefined
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    configId: formData.configId,
    configLevel: formData.configLevel === -1 ? undefined : formData.configLevel,
    productId: formData.productId,
    deviceId: formData.deviceId === undefined ? undefined : String(formData.deviceId),
    processStatus: formData.processStatus === -1 ? undefined : formData.processStatus,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.configId = undefined
  formData.configLevel = -1
  formData.productId = undefined
  formData.deviceId = undefined
  formData.processStatus = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
