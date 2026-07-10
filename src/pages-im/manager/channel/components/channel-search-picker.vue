<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    all-option
    :all-value="0"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import { onMounted, ref } from 'vue'
import { getSimpleChannelList } from '@/api/im/manager/channel'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '所属频道',
  placeholder: '请选择频道',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [item: ImManagerChannelVO | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<ImManagerChannelVO[]>([]) // 频道选项

/** 更新频道 */
function handleUpdate(value: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化频道 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null || value === 0 ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleChannelList()
})
</script>
