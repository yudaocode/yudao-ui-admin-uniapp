<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="title"
    value-key="id"
    :placeholder="channelId ? placeholder : '请先选择频道'"
    :disabled="!channelId"
    all-option
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { ImManagerChannelMaterialVO } from '@/api/im/manager/channel/material'
import { ref, watch } from 'vue'
import { getSimpleManagerChannelMaterialList } from '@/api/im/manager/channel/material'

const props = withDefaults(defineProps<{
  modelValue?: number
  channelId?: number
  label?: string
  placeholder?: string
}>(), {
  label: '频道素材',
  placeholder: '请选择频道素材',
})

const emit = defineEmits<{
  'update:modelValue': [value?: number]
  'change': [item: ImManagerChannelMaterialVO | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<ImManagerChannelMaterialVO[]>([]) // 素材选项

/** 更新素材 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 加载频道素材 */
async function loadOptions(channelId?: number) {
  options.value = channelId ? await getSimpleManagerChannelMaterialList(channelId) : []
  if (props.modelValue && !options.value.some(item => item.id === props.modelValue)) {
    handleUpdate(undefined)
  }
}

/** 格式化素材 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value === undefined ? '' : String(value))
}

/** 监听频道变化 */
watch(() => props.channelId, loadOptions, { immediate: true })

defineExpose({ format })
</script>
