<template>
  <view class="mb-16rpx rounded-8rpx bg-[#f7f8fa]">
    <view class="flex items-center justify-between px-20rpx py-14rpx">
      <text class="text-26rpx text-[#333] font-medium">条件 {{ index + 1 }}</text>
      <text class="text-26rpx text-[#fa4350]" @click="emit('remove')">删除</text>
    </view>
    <wd-cell-group border>
      <yd-form-picker
        v-model="conditionData.type"
        label="条件类型"
        :columns="conditionTypeOptions"
        label-key="label"
        value-key="value"
        placeholder="请选择条件类型"
        label-width="200rpx"
        @update:model-value="onConditionTypeChange"
      />

      <!-- 设备类条件 -->
      <template v-if="isDeviceCondition">
        <ProductFormPicker
          v-model="conditionData.productId"
          label="产品"
          label-width="200rpx"
          placeholder="请选择产品"
          :columns="productOptions"
          @update:model-value="onProductChange"
        />
        <DeviceFormPicker
          v-model="conditionData.deviceId"
          label="设备"
          label-width="200rpx"
          placeholder="请选择设备"
          :columns="deviceOptions"
        />
      </template>

      <!-- 设备状态条件 -->
      <template v-if="isDeviceStatus">
        <yd-form-picker
          v-model="conditionData.operator"
          label="操作符"
          :columns="statusOperatorOptions"
          label-key="label"
          value-key="value"
          placeholder="请选择操作符"
          label-width="200rpx"
        />
        <yd-form-picker
          v-model="conditionData.param"
          label="设备状态"
          :columns="deviceStatusOptions"
          label-key="label"
          value-key="value"
          placeholder="请选择设备状态"
          label-width="200rpx"
        />
      </template>

      <!-- 设备属性条件 -->
      <template v-else-if="isDeviceProperty">
        <ThingModelPicker
          v-model="conditionData.identifier"
          label="监控项"
          :columns="propertyOptions"
          label-key="name"
          value-key="identifier"
          placeholder="请选择监控项"
          label-width="200rpx"
        />
        <yd-form-picker
          v-model="conditionData.operator"
          label="操作符"
          :columns="operatorOptions"
          label-key="label"
          value-key="value"
          placeholder="请选择操作符"
          label-width="200rpx"
        />
        <wd-form-item title="比较值" title-width="200rpx">
          <wd-input v-model="conditionData.param" placeholder="请输入比较值" />
        </wd-form-item>
      </template>

      <!-- 当前时间条件 -->
      <template v-else-if="isCurrentTime">
        <yd-form-picker
          v-model="conditionData.operator"
          label="时间条件"
          :columns="timeOperatorOptions"
          label-key="label"
          value-key="value"
          placeholder="请选择时间条件"
          label-width="200rpx"
          @update:model-value="onTimeOperatorChange"
        />
        <template v-if="needsTimeInput">
          <wd-form-item title="时间值" title-width="200rpx">
            <wd-input v-model="timeValue" placeholder="HH:mm:ss" />
          </wd-form-item>
          <wd-form-item v-if="needsSecondTimeInput" title="结束时间" title-width="200rpx">
            <wd-input v-model="timeValue2" placeholder="HH:mm:ss" />
          </wd-form-item>
        </template>
      </template>
    </wd-cell-group>
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/iot/product/product'
import type { TriggerCondition } from '@/api/iot/rule/scene'
import { computed, ref, watch } from 'vue'
import { getDeviceListByProductId } from '@/api/iot/device/device'
import { getThingModelList } from '@/api/iot/thingmodel'
import DeviceFormPicker from '@/pages-iot/device/device/components/device-form-picker.vue'
import ProductFormPicker from '@/pages-iot/product/product/components/product-form-picker.vue'
import ThingModelPicker from '@/pages-iot/thingmodel/components/thing-model-picker.vue'
import {
  conditionTypeOptions,
  deviceStatusOptions,
  IOT_ALL_DEVICE_OPTION,
  IotRuleSceneTriggerConditionParameterOperatorEnum,
  IotRuleSceneTriggerConditionTypeEnum,
  IotRuleSceneTriggerTimeOperatorEnum,
  IoTThingModelTypeEnum,
  operatorOptions,
  statusOperatorOptions,
  timeOperatorOptions,
} from '@/utils/constants'

const props = defineProps<{ condition: TriggerCondition, productOptions: Product[], index: number }>()
const emit = defineEmits<{
  (e: 'remove'): void
  (e: 'update:condition', value: TriggerCondition): void
}>()

const deviceOptions = ref<any[]>([]) // 设备选项
const thingModelList = ref<any[]>([]) // 物模型选项
const conditionData = ref<TriggerCondition>(cloneCondition(props.condition)) // 本地条件数据

const isDeviceStatus = computed(() => conditionData.value.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS)
const isDeviceProperty = computed(() => conditionData.value.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY)
const isCurrentTime = computed(() => conditionData.value.type === IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME)
const isDeviceCondition = computed(() => isDeviceStatus.value || isDeviceProperty.value)
const propertyOptions = computed(() => thingModelList.value.filter(item => item.type === IoTThingModelTypeEnum.PROPERTY))
const needsSecondTimeInput = computed(() => conditionData.value.operator === IotRuleSceneTriggerTimeOperatorEnum.BETWEEN_TIME.value)
const needsTimeInput = computed(() => conditionData.value.operator !== IotRuleSceneTriggerTimeOperatorEnum.TODAY.value)
const timeValue = computed({
  get: () => getTimePart(0),
  set: value => setTimePart(0, value),
})
const timeValue2 = computed({
  get: () => getTimePart(1),
  set: value => setTimePart(1, value),
})

/** 克隆条件 */
function cloneCondition(condition: TriggerCondition): TriggerCondition {
  return { ...condition }
}

/** 判断条件是否一致 */
function isSameCondition(left?: TriggerCondition, right?: TriggerCondition) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {})
}

watch(
  () => props.condition,
  (condition) => {
    const nextCondition = cloneCondition(condition)
    if (!isSameCondition(nextCondition, conditionData.value)) {
      conditionData.value = nextCondition
    }
  },
  { deep: true },
)

watch(
  conditionData,
  (condition) => {
    const nextCondition = cloneCondition(condition)
    if (!isSameCondition(nextCondition, props.condition)) {
      emit('update:condition', nextCondition)
    }
  },
  { deep: true },
)

/** 产品变化时加载设备和物模型 */
watch(() => conditionData.value.productId, async (productId) => {
  const devices = productId ? await getDeviceListByProductId(productId) : []
  deviceOptions.value = productId ? [IOT_ALL_DEVICE_OPTION, ...devices] : []
  thingModelList.value = productId ? await getThingModelList({ productId }) : []
}, { immediate: true })

/** 条件类型切换 */
function onConditionTypeChange() {
  conditionData.value.productId = undefined
  conditionData.value.deviceId = undefined
  conditionData.value.identifier = undefined
  conditionData.value.param = ''
  if (isCurrentTime.value) {
    conditionData.value.operator = IotRuleSceneTriggerTimeOperatorEnum.AT_TIME.value
    return
  }
  conditionData.value.operator = IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value
}

/** 产品切换 */
function onProductChange() {
  conditionData.value.deviceId = undefined
  conditionData.value.identifier = undefined
}

/** 时间条件切换 */
function onTimeOperatorChange() {
  if (conditionData.value.operator === IotRuleSceneTriggerTimeOperatorEnum.TODAY.value) {
    conditionData.value.param = ''
  } else if (!needsSecondTimeInput.value) {
    conditionData.value.param = getTimePart(0)
  }
}

/** 获取时间片段 */
function getTimePart(index: number) {
  return String(conditionData.value.param || '').split(',')[index] || ''
}

/** 设置时间片段 */
function setTimePart(index: number, value: string) {
  const parts = String(conditionData.value.param || '').split(',')
  parts[index] = value || ''
  conditionData.value.param = needsSecondTimeInput.value ? parts.slice(0, 2).join(',') : parts[0]
}
</script>
