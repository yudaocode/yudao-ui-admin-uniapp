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
      <yd-search-picker
        v-model="formData.configId"
        label="告警配置"
        :columns="configOptions"
        label-key="name"
        value-key="id"
        placeholder="请选择告警配置"
      />
      <yd-search-picker
        v-model="formData.configLevel"
        label="告警级别"
        :dict-type="DICT_TYPE.IOT_ALERT_LEVEL"
        all-option
      />
      <yd-search-picker
        v-model="formData.productId"
        label="产品"
        :columns="productOptions"
        label-key="name"
        value-key="id"
        placeholder="请选择产品"
      />
      <yd-search-picker
        v-model="formData.deviceId"
        label="设备"
        :columns="deviceOptions"
        label-key="deviceName"
        value-key="id"
        placeholder="请选择设备"
      />
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
import type { AlertConfig } from '@/api/iot/alert/config'
import type { Device } from '@/api/iot/device/device'
import type { Product } from '@/api/iot/product/product'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getSimpleAlertConfigList } from '@/api/iot/alert/config'
import { getSimpleDeviceList } from '@/api/iot/device/device'
import { getSimpleProductList } from '@/api/iot/product/product'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const configOptions = ref<AlertConfig[]>([]) // 告警配置选项
const productOptions = ref<Product[]>([]) // 产品选项
const allDeviceOptions = ref<Device[]>([]) // 全部设备选项
const deviceOptions = ref<Device[]>([]) // 设备选项
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
    conditions.push(`配置:${findOptionName(configOptions.value, formData.configId)}`)
  }
  if (formData.configLevel !== -1) {
    conditions.push(`级别:${getDictLabel(DICT_TYPE.IOT_ALERT_LEVEL, formData.configLevel)}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${findOptionName(productOptions.value, formData.productId)}`)
  }
  if (formData.deviceId) {
    conditions.push(`设备:${findOptionName(allDeviceOptions.value, formData.deviceId, 'deviceName')}`)
  }
  if (formData.processStatus !== -1) {
    conditions.push(`处理:${formData.processStatus ? '已处理' : '未处理'}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索告警记录'
})

/** 切换产品时按产品过滤设备并清空已选设备 */
watch(() => formData.productId, async (productId) => {
  formData.deviceId = undefined
  deviceOptions.value = productId ? await getSimpleDeviceList(undefined, productId) : allDeviceOptions.value
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    configId: formData.configId,
    configLevel: formData.configLevel === -1 ? undefined : formData.configLevel,
    productId: formData.productId,
    deviceId: formData.deviceId,
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
  deviceOptions.value = allDeviceOptions.value
  visible.value = false
  emit('reset')
}

/** 获取选项名称 */
function findOptionName(options: Record<string, any>[], id?: number, labelKey = 'name') {
  return options.find(item => String(item.id) === String(id))?.[labelKey] || String(id || '')
}

/** 初始化 */
onMounted(async () => {
  const [configs, products, devices] = await Promise.all([
    getSimpleAlertConfigList(),
    getSimpleProductList(),
    getSimpleDeviceList(),
  ])
  configOptions.value = configs
  productOptions.value = products
  allDeviceOptions.value = devices
  deviceOptions.value = devices
})
</script>
