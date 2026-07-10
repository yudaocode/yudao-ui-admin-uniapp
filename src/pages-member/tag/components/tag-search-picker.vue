<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    type="checkbox"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { MemberTag } from '@/api/member/tag'
import { onMounted, ref } from 'vue'
import { getSimpleMemberTagList } from '@/api/member/tag'

const props = withDefaults(defineProps<{
  modelValue?: number[]
  label?: string
  placeholder?: string
}>(), {
  label: '用户标签',
  placeholder: '请选择用户标签',
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<MemberTag[]>([]) // 用户标签选项

/** 更新用户标签编号 */
function handleUpdate(value?: number[]) {
  emit('update:modelValue', Array.isArray(value) ? value.map(Number) : [])
}

/** 格式化用户标签编号 */
function format(value?: number[]) {
  return pickerRef.value?.format(value) || (value?.join('、') || '')
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleMemberTagList()
})
</script>
