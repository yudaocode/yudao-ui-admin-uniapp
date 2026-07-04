<template>
  <view class="mb-20rpx rounded-12rpx bg-white">
    <view class="flex items-center justify-between px-24rpx py-16rpx">
      <text class="text-28rpx text-[#333] font-semibold">触发器 {{ index + 1 }}</text>
      <text class="text-26rpx text-[#fa4350]" @click="emit('remove')">删除</text>
    </view>
    <wd-cell-group border>
      <yd-form-picker
        v-model="triggerData.type"
        label="触发方式"
        :columns="triggerTypeOptions"
        label-key="label"
        value-key="value"
        placeholder="请选择触发方式"
        label-width="200rpx"
        @update:model-value="onTypeChange"
      />
      <!-- 设备类触发 -->
      <template v-if="isDevice">
        <ProductPicker
          v-model="triggerData.productId"
          label="产品"
          :columns="productOptions"
          placeholder="请选择产品"
          label-width="200rpx"
          @update:model-value="onProductChange"
        />
        <DevicePicker
          v-model="triggerData.deviceId"
          label="设备"
          :columns="deviceOptions"
          placeholder="请选择设备"
          label-width="200rpx"
        />
        <ThingModelPicker
          v-if="showIdentifier"
          v-model="triggerData.identifier"
          label="监控项"
          :columns="identifierOptions"
          label-key="name"
          value-key="identifier"
          placeholder="请选择监控项"
          label-width="200rpx"
        />
        <template v-if="showOperatorValue">
          <yd-form-picker
            v-model="triggerData.operator"
            label="操作符"
            :columns="operatorOptions"
            label-key="label"
            value-key="value"
            placeholder="请选择操作符"
            label-width="200rpx"
          />
          <yd-form-picker
            v-if="isStateUpdate"
            v-model="triggerData.value"
            label="设备状态"
            :columns="deviceStatusOptions"
            label-key="label"
            value-key="value"
            placeholder="请选择设备状态"
            label-width="200rpx"
          />
          <wd-form-item v-else title="比较值" title-width="200rpx">
            <wd-input v-model="triggerData.value" placeholder="请输入比较值" />
          </wd-form-item>
        </template>
      </template>
      <!-- 定时触发 -->
      <wd-form-item v-else title="CRON 表达式" title-width="200rpx">
        <wd-input v-model="triggerData.cronExpression" placeholder="如 0 0 12 * * ?" />
      </wd-form-item>
    </wd-cell-group>

    <!-- 附加条件组 -->
    <ConditionGroupEditor v-model="triggerData.conditionGroups" :product-options="productOptions" />
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/iot/product/product'
import type { Trigger } from '@/api/iot/rule/scene'
import { computed, ref, watch } from 'vue'
import { getDeviceListByProductId } from '@/api/iot/device/device'
import { getThingModelList } from '@/api/iot/thingmodel'
import DevicePicker from '@/pages-iot/device/device/components/device-picker.vue'
import ProductPicker from '@/pages-iot/product/product/components/product-picker.vue'
import ThingModelPicker from '@/pages-iot/thingmodel/components/thing-model-picker.vue'
import { deviceStatusOptions, IOT_ALL_DEVICE_OPTION, IotRuleSceneTriggerTypeEnum, IoTThingModelTypeEnum, isDeviceTrigger, operatorOptions, triggerTypeOptions } from '@/utils/constants'
import ConditionGroupEditor from './condition-group-editor.vue'

const props = defineProps<{ trigger: Trigger, productOptions: Product[], index: number }>()
const emit = defineEmits<{
  (e: 'remove'): void
  (e: 'update:trigger', value: Trigger): void
}>()

const deviceOptions = ref<any[]>([]) // 设备选项
const thingModelList = ref<any[]>([]) // 产品物模型列表
const triggerData = ref<Trigger>(cloneTrigger(props.trigger)) // 本地触发器数据

const isDevice = computed(() => isDeviceTrigger(triggerData.value.type))
const isStateUpdate = computed(() => triggerData.value.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE)
const showIdentifier = computed(() => [IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST, IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST, IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE].includes(triggerData.value.type as any))
const showOperatorValue = computed(() => isStateUpdate.value || triggerData.value.type === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST)
const identifierOptions = computed(() => {
  // 按触发类型过滤物模型：属性 / 事件 / 服务
  const typeMap: Record<number, number> = {
    [IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST]: IoTThingModelTypeEnum.PROPERTY,
    [IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST]: IoTThingModelTypeEnum.EVENT,
    [IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE]: IoTThingModelTypeEnum.SERVICE,
  }
  return thingModelList.value.filter(item => item.type === typeMap[triggerData.value.type])
})

/** 克隆触发器，避免直接修改 props */
function cloneTrigger(trigger: Trigger): Trigger {
  return {
    ...trigger,
    conditionGroups: trigger.conditionGroups?.map(group => group.map(condition => ({ ...condition }))),
  }
}

/** 判断触发器是否一致 */
function isSameTrigger(left?: Trigger, right?: Trigger) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {})
}

watch(
  () => props.trigger,
  (trigger) => {
    const nextTrigger = cloneTrigger(trigger)
    if (!isSameTrigger(nextTrigger, triggerData.value)) {
      triggerData.value = nextTrigger
    }
  },
  { deep: true },
)

watch(
  triggerData,
  (trigger) => {
    const nextTrigger = cloneTrigger(trigger)
    if (!isSameTrigger(nextTrigger, props.trigger)) {
      emit('update:trigger', nextTrigger)
    }
  },
  { deep: true },
)

/** 产品变化时加载该产品的设备与物模型 */
watch(() => triggerData.value.productId, async (productId) => {
  const devices = productId ? await getDeviceListByProductId(productId) : []
  deviceOptions.value = productId ? [IOT_ALL_DEVICE_OPTION, ...devices] : []
  thingModelList.value = productId ? await getThingModelList({ productId }) : []
}, { immediate: true })

/** 切换触发方式重置相关字段 */
function onTypeChange() {
  triggerData.value.productId = undefined
  triggerData.value.deviceId = undefined
  triggerData.value.identifier = undefined
  triggerData.value.operator = undefined
  triggerData.value.value = undefined
  triggerData.value.cronExpression = undefined
  triggerData.value.conditionGroups = []
}

/** 切换产品重置设备与监控项 */
function onProductChange() {
  triggerData.value.deviceId = undefined
  triggerData.value.identifier = undefined
}
</script>
