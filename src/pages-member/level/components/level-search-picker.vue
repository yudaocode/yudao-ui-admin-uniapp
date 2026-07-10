<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { MemberLevel } from '@/api/member/level'
import { onMounted, ref } from 'vue'
import { getSimpleMemberLevelList } from '@/api/member/level'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '用户等级',
  placeholder: '请选择用户等级',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MemberLevel | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<MemberLevel[]>([]) // 用户等级选项

/** 更新用户等级编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(option => option.id === value))
}

/** 格式化用户等级编号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleMemberLevelList()
})
</script>
