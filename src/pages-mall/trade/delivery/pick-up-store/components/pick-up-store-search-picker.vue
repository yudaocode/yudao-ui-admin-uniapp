<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    :all-option="allOption"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { DeliveryPickUpStore } from '@/api/mall/trade/delivery/pick-up-store'
import { computed, onMounted, ref } from 'vue'
import { getSimpleDeliveryPickUpStoreList } from '@/api/mall/trade/delivery/pick-up-store'

const props = withDefaults(defineProps<{
  options?: DeliveryPickUpStore[]
  allOption?: boolean
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  options: undefined,
  allOption: true,
  label: '自提门店',
  placeholder: '请选择自提门店',
})

const emit = defineEmits<{
  'update:modelValue': [value?: number]
  'change': [item: DeliveryPickUpStore | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const loadedOptions = ref<DeliveryPickUpStore[]>([])
const options = computed(() => props.options ?? loadedOptions.value) // 自提门店选项

/** 更新自提门店 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化自提门店 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value === undefined ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  if (props.options === undefined) {
    loadedOptions.value = await getSimpleDeliveryPickUpStoreList()
  }
})
</script>
