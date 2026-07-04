<template>
  <view class="mb-20rpx rounded-12rpx bg-white">
    <view class="flex items-center justify-between px-24rpx py-16rpx">
      <text class="text-28rpx text-[#333] font-semibold">执行器 {{ index + 1 }}</text>
      <text class="text-26rpx text-[#fa4350]" @click="emit('remove')">删除</text>
    </view>
    <wd-cell-group border>
      <yd-form-picker
        v-model="actionData.type"
        label="执行动作"
        :columns="actionTypeOptions"
        label-key="label"
        value-key="value"
        placeholder="请选择执行动作"
        label-width="200rpx"
        @update:model-value="onTypeChange"
      />
      <!-- 设备控制 -->
      <template v-if="isDeviceControl">
        <ProductPicker
          v-model="actionData.productId"
          label="产品"
          :columns="productOptions"
          placeholder="请选择产品"
          label-width="200rpx"
          @update:model-value="onProductChange"
        />
        <DevicePicker
          v-model="actionData.deviceId"
          label="设备"
          :columns="deviceOptions"
          placeholder="请选择设备"
          label-width="200rpx"
        />
        <ThingModelPicker
          v-if="isServiceInvoke"
          v-model="actionData.identifier"
          label="服务"
          :columns="serviceOptions"
          label-key="name"
          value-key="identifier"
          placeholder="请选择服务"
          label-width="200rpx"
          @update:model-value="onIdentifierChange"
        />
        <wd-form-item
          v-if="!isServiceInvoke || actionData.identifier"
          :title="isServiceInvoke ? '服务参数(JSON)' : '参数(JSON)'"
          title-width="200rpx"
        >
          <wd-textarea v-model="actionData.params" placeholder="如 {&quot;switch&quot;: 1}" />
        </wd-form-item>
      </template>
      <!-- 触发告警 -->
      <wd-cell v-else-if="actionData.type === IotRuleSceneActionTypeEnum.ALERT_TRIGGER" title="触发告警" value="自动执行" />
      <!-- 恢复告警 -->
      <AlertConfigPicker
        v-else
        v-model="actionData.alertConfigId"
        label="告警配置"
        :columns="alertConfigOptions"
        placeholder="请选择告警配置"
        label-width="200rpx"
      />
    </wd-cell-group>

    <!-- 参数提示 -->
    <view v-if="isDeviceControl" class="border-t border-[#f2f3f5] px-24rpx py-20rpx">
      <view class="mb-12rpx flex items-center justify-between">
        <text class="text-26rpx text-[#666]">参数提示</text>
        <wd-button v-if="paramsHintList.length" size="small" type="primary" variant="plain" @click="fillParamsExample">
          填充示例
        </wd-button>
      </view>
      <view v-if="paramsHintList.length">
        <view
          v-for="param in paramsHintList"
          :key="param.identifier"
          class="mb-10rpx rounded-8rpx bg-[#f7f8fa] px-16rpx py-12rpx"
        >
          <view class="text-26rpx text-[#333]">
            {{ param.name || param.identifier }}
            <text v-if="param.required" class="ml-8rpx text-[#fa4350]">必填</text>
          </view>
          <view class="mt-4rpx text-24rpx text-[#999]">
            {{ param.identifier }} / {{ param.dataType || '-' }}
          </view>
        </view>
        <view class="rounded-8rpx bg-[#f7f8fa] px-16rpx py-12rpx text-24rpx text-[#666]">
          {{ paramsExampleText }}
        </view>
        <view v-if="paramsJsonMessage" class="mt-10rpx text-24rpx" :class="paramsJsonError ? 'text-[#fa4350]' : 'text-[#07c160]'">
          {{ paramsJsonMessage }}
        </view>
      </view>
      <view v-else class="text-24rpx text-[#999]">
        {{ paramsEmptyText }}
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AlertConfig } from '@/api/iot/alert/config'
import type { Product } from '@/api/iot/product/product'
import type { Action } from '@/api/iot/rule/scene'
import type { ThingModelParam, ThingModelProperty, ThingModelService } from '@/api/iot/thingmodel'
import { computed, ref, watch } from 'vue'
import { getDeviceListByProductId } from '@/api/iot/device/device'
import { getThingModelTSLByProductId } from '@/api/iot/thingmodel'
import AlertConfigPicker from '@/pages-iot/alert/config/components/alert-config-picker.vue'
import DevicePicker from '@/pages-iot/device/device/components/device-picker.vue'
import ProductPicker from '@/pages-iot/product/product/components/product-picker.vue'
import ThingModelPicker from '@/pages-iot/thingmodel/components/thing-model-picker.vue'
import { actionTypeOptions, IOT_ALL_DEVICE_OPTION, IoTDataSpecsDataTypeEnum, IotRuleSceneActionTypeEnum, IoTThingModelAccessModeEnum } from '@/utils/constants'
import { formatJson } from '@/utils/format'

const props = defineProps<{
  action: Action
  productOptions: Product[]
  alertConfigOptions: AlertConfig[]
  index: number
}>()
const emit = defineEmits<{
  (e: 'remove'): void
  (e: 'update:action', value: Action): void
}>()

const deviceOptions = ref<any[]>([]) // 设备选项
const propertyList = ref<ThingModelProperty[]>([]) // 产品属性列表
const serviceList = ref<ThingModelService[]>([]) // 产品服务列表
const actionData = ref<Action>(cloneAction(props.action)) // 本地执行器数据

const isServiceInvoke = computed(() => actionData.value.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE)
const isDeviceControl = computed(() => actionData.value.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET || isServiceInvoke.value)
const serviceOptions = computed(() => serviceList.value) // 服务选项
const selectedService = computed(() => serviceList.value.find(item => item.identifier === actionData.value.identifier)) // 当前服务
const writableAccessModes = [
  IoTThingModelAccessModeEnum.READ_WRITE.value,
  IoTThingModelAccessModeEnum.WRITE_ONLY.value,
] as string[] // 可写属性访问模式
const writablePropertyList = computed(() => { // 可写属性列表
  return propertyList.value.filter(property => property.accessMode && writableAccessModes.includes(property.accessMode))
})
const paramsHintList = computed(() => { // 参数提示列表
  if (isServiceInvoke.value) {
    return (selectedService.value?.inputParams || []).map(normalizeParam)
  }
  return writablePropertyList.value.map(normalizeParam)
})
const paramsExampleText = computed(() => formatJson(buildParamsExample(), '{}'))
const paramsEmptyText = computed(() => { // 参数提示空状态
  if (isServiceInvoke.value) {
    return actionData.value.productId ? '选择服务后可生成参数示例' : '选择产品和服务后可生成参数示例'
  }
  return actionData.value.productId ? '暂无可写属性，可手动填写 JSON 参数' : '选择产品后可生成参数示例'
})
const paramsJsonError = computed(() => {
  if (!actionData.value.params?.trim()) {
    return ''
  }
  try {
    const parsed = JSON.parse(actionData.value.params)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return '参数必须是 JSON 对象'
    }
  } catch {
    return '参数格式须为合法 JSON'
  }
  return ''
})
const paramsJsonMessage = computed(() => {
  if (!actionData.value.params?.trim()) {
    return ''
  }
  return paramsJsonError.value || 'JSON 格式正确'
})

/** 克隆执行器，避免直接修改 props */
function cloneAction(action: Action): Action {
  return { ...action }
}

/** 判断执行器是否一致 */
function isSameAction(left?: Action, right?: Action) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {})
}

watch(
  () => props.action,
  (action) => {
    const nextAction = cloneAction(action)
    if (!isSameAction(nextAction, actionData.value)) {
      actionData.value = nextAction
    }
  },
  { deep: true },
)

watch(
  actionData,
  (action) => {
    const nextAction = cloneAction(action)
    if (!isSameAction(nextAction, props.action)) {
      emit('update:action', nextAction)
    }
  },
  { deep: true },
)

/** 产品变化时加载该产品的设备与物模型 */
watch(() => actionData.value.productId, async (productId) => {
  if (!productId) {
    deviceOptions.value = []
    propertyList.value = []
    serviceList.value = []
    return
  }
  const [devices, tslData] = await Promise.all([
    getDeviceListByProductId(productId),
    getThingModelTSLByProductId(productId),
  ])
  deviceOptions.value = [IOT_ALL_DEVICE_OPTION, ...devices]
  propertyList.value = tslData.properties || []
  serviceList.value = tslData.services || []
}, { immediate: true })

/** 切换执行动作重置相关字段 */
function onTypeChange() {
  if (isDeviceControl.value) {
    actionData.value.alertConfigId = undefined
    actionData.value.identifier = undefined
    actionData.value.params = ''
    return
  }
  actionData.value.productId = undefined
  actionData.value.deviceId = undefined
  actionData.value.identifier = undefined
  actionData.value.params = undefined
  actionData.value.alertConfigId = undefined
}

/** 切换产品重置设备与监控项 */
function onProductChange() {
  actionData.value.deviceId = undefined
  actionData.value.identifier = undefined
  actionData.value.params = ''
}

/** 切换服务 */
function onIdentifierChange() {
  actionData.value.params = ''
}

/** 标准化参数 */
function normalizeParam(param: ThingModelParam | ThingModelProperty) {
  return {
    identifier: param.identifier || '',
    name: param.name || param.identifier || '',
    dataType: param.dataType || '',
    required: 'required' in param ? !!param.required : false,
  }
}

/** 生成参数示例 */
function buildParamsExample() {
  const example: Record<string, unknown> = {}
  paramsHintList.value.forEach((param) => {
    example[param.identifier] = getDefaultValue(param.dataType)
  })
  return example
}

/** 获取默认参数值 */
function getDefaultValue(dataType?: string) {
  switch (dataType) {
    case IoTDataSpecsDataTypeEnum.INT:
      return 0
    case IoTDataSpecsDataTypeEnum.FLOAT:
    case IoTDataSpecsDataTypeEnum.DOUBLE:
      return 0.0
    case IoTDataSpecsDataTypeEnum.BOOL:
      return false
    case IoTDataSpecsDataTypeEnum.STRUCT:
      return {}
    case IoTDataSpecsDataTypeEnum.ARRAY:
      return []
    default:
      return ''
  }
}

/** 填充参数示例 */
function fillParamsExample() {
  actionData.value.params = paramsExampleText.value
}
</script>
