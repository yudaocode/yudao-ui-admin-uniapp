<template>
  <!-- 数值型：取值范围 / 步长 / 单位 -->
  <template v-if="isNumber">
    <wd-form-item title="最小值" :title-width="titleWidth">
      <wd-input v-model="targetData.dataSpecs.min" placeholder="请输入最小值" />
    </wd-form-item>
    <wd-form-item title="最大值" :title-width="titleWidth">
      <wd-input v-model="targetData.dataSpecs.max" placeholder="请输入最大值" />
    </wd-form-item>
    <wd-form-item title="步长" :title-width="titleWidth">
      <wd-input v-model="targetData.dataSpecs.step" placeholder="请输入步长" />
    </wd-form-item>
    <yd-form-picker
      v-model="targetData.dataSpecs.unit"
      label="单位"
      :columns="unitOptions"
      label-key="label"
      value-key="value"
      placeholder="请选择单位"
      :label-width="titleWidth"
      @confirm="syncUnitName"
    />
  </template>
  <!-- 文本型：数据长度 -->
  <wd-form-item v-else-if="isText" title="数据长度" :title-width="titleWidth">
    <wd-input v-model="targetData.dataSpecs.length" placeholder="请输入文本字节长度" />
  </wd-form-item>
  <!-- 布尔型：0 / 1 文案 -->
  <template v-else-if="isBool">
    <wd-form-item v-for="item in targetData.dataSpecsList" :key="item.value" :title="`布尔值 ${item.value}`" :title-width="titleWidth">
      <wd-input v-model="item.name" :placeholder="item.value === 0 ? '如：关' : '如：开'" />
    </wd-form-item>
  </template>
  <!-- 枚举型：枚举项列表 -->
  <view v-else-if="isEnum" class="bg-white px-32rpx py-20rpx">
    <view class="mb-12rpx text-26rpx text-[#999]">
      枚举项（参数值 + 描述）
    </view>
    <view v-for="(item, index) in targetData.dataSpecsList" :key="index" class="mb-16rpx flex items-center gap-12rpx">
      <wd-input v-model="item.value" class="flex-1" placeholder="枚举值，如 0" />
      <wd-input v-model="item.name" class="flex-1" placeholder="枚举描述" />
      <wd-icon name="delete" size="40rpx" color="#fa4350" @click="removeEnum(Number(index))" />
    </view>
    <wd-button size="small" type="primary" variant="plain" @click="addEnum">
      + 添加枚举项
    </wd-button>
  </view>
  <!-- 时间型：提示 -->
  <wd-form-item v-else-if="isDate" title="时间格式" :title-width="titleWidth">
    <text class="text-26rpx text-[#999]">String 类型 UTC 毫秒时间戳</text>
  </wd-form-item>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { getStrDictOptions } from '@/hooks/useDict'
import { DICT_TYPE, IoTDataSpecsDataTypeEnum } from '@/utils/constants'

const props = withDefaults(defineProps<{ target: Record<string, any>, titleWidth?: string }>(), { titleWidth: '200rpx' })
const emit = defineEmits<{ (e: 'update:target', value: Record<string, any>): void }>()

const unitOptions = getStrDictOptions(DICT_TYPE.IOT_THING_MODEL_UNIT) // 单位字典选项
const targetData = ref<Record<string, any>>(cloneTarget(props.target)) // 本地数据定义
const isNumber = computed(() => [IoTDataSpecsDataTypeEnum.INT, IoTDataSpecsDataTypeEnum.FLOAT, IoTDataSpecsDataTypeEnum.DOUBLE].includes(targetData.value.dataType))
const isText = computed(() => targetData.value.dataType === IoTDataSpecsDataTypeEnum.TEXT)
const isBool = computed(() => targetData.value.dataType === IoTDataSpecsDataTypeEnum.BOOL)
const isEnum = computed(() => targetData.value.dataType === IoTDataSpecsDataTypeEnum.ENUM)
const isDate = computed(() => targetData.value.dataType === IoTDataSpecsDataTypeEnum.DATE)

/** 克隆数据定义 */
function cloneTarget(target: Record<string, any>) {
  return {
    ...target,
    dataSpecs: target.dataSpecs ? { ...target.dataSpecs } : {},
    dataSpecsList: target.dataSpecsList ? target.dataSpecsList.map((item: Record<string, any>) => ({ ...item })) : [],
  }
}

/** 判断数据定义是否一致 */
function isSameTarget(left?: Record<string, any>, right?: Record<string, any>) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {})
}

watch(
  () => props.target,
  (target) => {
    const nextTarget = cloneTarget(target)
    if (!isSameTarget(nextTarget, targetData.value)) {
      targetData.value = nextTarget
    }
  },
  { deep: true },
)

watch(
  targetData,
  (target) => {
    const nextTarget = cloneTarget(target)
    if (!isSameTarget(nextTarget, props.target)) {
      emit('update:target', nextTarget)
    }
  },
  { deep: true },
)

/** 同步单位名称 */
function syncUnitName(unit = targetData.value.dataSpecs?.unit) {
  if (!isNumber.value || !targetData.value.dataSpecs) {
    return
  }
  targetData.value.dataSpecs.unitName = unitOptions.find(item => String(item.value) === String(unit))?.label || ''
}

/** 单位选定时同步单位名称 */
watch(() => targetData.value.dataSpecs?.unit, unit => syncUnitName(unit))

/** 添加枚举项 */
function addEnum() {
  targetData.value.dataSpecsList.push({ dataType: IoTDataSpecsDataTypeEnum.ENUM, name: '', value: undefined })
}

/** 删除枚举项 */
function removeEnum(index: number) {
  if (targetData.value.dataSpecsList.length > 1) {
    targetData.value.dataSpecsList.splice(index, 1)
  }
}
</script>
