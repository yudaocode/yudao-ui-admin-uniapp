<template>
  <SimpleDataSpecsForm
    v-if="isSimple"
    :target="targetData"
    :title-width="titleWidth"
    @update:target="assignTarget"
  />

  <!-- 数组型：元素类型 / 元素个数 / 结构体字段 -->
  <template v-else-if="isArray">
    <yd-form-picker
      v-model="targetData.dataSpecs.childDataType"
      label="元素类型"
      :columns="arrayChildDataTypeOptions"
      label-key="label"
      value-key="value"
      placeholder="请选择元素类型"
      :label-width="titleWidth"
      @update:model-value="onArrayChildTypeChange"
    />
    <wd-form-item title="元素个数" :title-width="titleWidth">
      <wd-input v-model="targetData.dataSpecs.size" placeholder="请输入数组中的元素个数" />
    </wd-form-item>
    <StructSpecList
      v-if="targetData.dataSpecs.childDataType === IoTDataSpecsDataTypeEnum.STRUCT"
      v-model="targetData.dataSpecs.dataSpecsList"
    />
  </template>

  <!-- 结构体：字段列表 -->
  <StructSpecList
    v-else-if="isStruct"
    v-model="targetData.dataSpecsList"
  />
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { getDataTypeOptions, IoTDataSpecsDataTypeEnum } from '@/utils/constants'
import SimpleDataSpecsForm from './simple-data-specs-form.vue'
import StructSpecList from './struct-spec-list.vue'

const props = withDefaults(defineProps<{ target: Record<string, any>, titleWidth?: string }>(), { titleWidth: '200rpx' })
const emit = defineEmits<{ (e: 'update:target', value: Record<string, any>): void }>()

const targetData = ref<Record<string, any>>(cloneTarget(props.target)) // 本地数据定义
const isArray = computed(() => targetData.value.dataType === IoTDataSpecsDataTypeEnum.ARRAY)
const isStruct = computed(() => targetData.value.dataType === IoTDataSpecsDataTypeEnum.STRUCT)
const isSimple = computed(() => !isArray.value && !isStruct.value)
const arrayChildDataTypeOptions = computed(() => { // 数组元素类型：对齐后端当前允许值
  const allowed = [
    IoTDataSpecsDataTypeEnum.STRUCT,
    IoTDataSpecsDataTypeEnum.INT,
    IoTDataSpecsDataTypeEnum.FLOAT,
    IoTDataSpecsDataTypeEnum.DOUBLE,
    IoTDataSpecsDataTypeEnum.TEXT,
  ]
  return getDataTypeOptions().filter(item => allowed.includes(item.value as any))
})

/** 克隆数据定义 */
function cloneTarget(target: Record<string, any>) {
  const dataSpecs = target.dataSpecs ? { ...target.dataSpecs } : {}
  if (Array.isArray(dataSpecs.dataSpecsList)) {
    dataSpecs.dataSpecsList = dataSpecs.dataSpecsList.map((item: Record<string, any>) => ({ ...item }))
  }
  return {
    ...target,
    dataSpecs,
    dataSpecsList: target.dataSpecsList ? target.dataSpecsList.map((item: Record<string, any>) => ({ ...item })) : [],
  }
}

/** 判断数据定义是否一致 */
function isSameTarget(left?: Record<string, any>, right?: Record<string, any>) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {})
}

/** 更新简单类型数据定义 */
function assignTarget(target: Record<string, any>) {
  Object.assign(targetData.value, target)
}

/** 数组元素类型切换 */
function onArrayChildTypeChange(value?: string | number | number[]) {
  if (!targetData.value.dataSpecs) {
    targetData.value.dataSpecs = { dataType: IoTDataSpecsDataTypeEnum.ARRAY }
  }
  targetData.value.dataSpecs.childDataType = String(value || '')
  if (targetData.value.dataSpecs.childDataType === IoTDataSpecsDataTypeEnum.STRUCT) {
    targetData.value.dataSpecs.dataSpecsList ||= []
  } else {
    delete targetData.value.dataSpecs.dataSpecsList
  }
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
</script>
