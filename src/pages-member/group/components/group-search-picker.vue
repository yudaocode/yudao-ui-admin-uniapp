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
import type { MemberGroup } from '@/api/member/group'
import { onMounted, ref } from 'vue'
import { getSimpleMemberGroupList } from '@/api/member/group'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '用户分组',
  placeholder: '请选择用户分组',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MemberGroup | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<MemberGroup[]>([]) // 用户分组选项

/** 更新用户分组编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(option => option.id === value))
}

/** 格式化用户分组编号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleMemberGroupList()
})
</script>
