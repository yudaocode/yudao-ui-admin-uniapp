<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    filterable
    all-option
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { RecruitChannel } from '@/api/hrm/recruit/channel'
import { onMounted, ref } from 'vue'
import { getRecruitChannelSimpleList } from '@/api/hrm/recruit/channel'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '招聘渠道',
  placeholder: '请选择招聘渠道',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: RecruitChannel | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<RecruitChannel[]>([]) // 渠道选项

/** 加载招聘渠道选项 */
async function loadOptions() {
  options.value = (await getRecruitChannelSimpleList()).filter(item => item.id != null)
}

/** 更新渠道编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化渠道 */
function format(value?: number | null) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
