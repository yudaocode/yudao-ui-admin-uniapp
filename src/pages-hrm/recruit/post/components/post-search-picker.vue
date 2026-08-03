<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="pickerLabel"
    value-key="id"
    :placeholder="placeholder"
    filterable
    all-option
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { RecruitPost } from '@/api/hrm/recruit/post'
import { onMounted, ref } from 'vue'
import { getRecruitPostSimpleList } from '@/api/hrm/recruit/post'

interface RecruitPostOption extends RecruitPost {
  pickerLabel: string
}

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '应聘职位',
  placeholder: '请选择应聘职位',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: RecruitPost | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<RecruitPostOption[]>([]) // 职位选项

/** 加载招聘职位选项 */
async function loadOptions() {
  const list = await getRecruitPostSimpleList()
  options.value = list.filter(item => item.id != null).map(item => ({
    ...item,
    pickerLabel: item.deptName ? `${item.postName}（${item.deptName}）` : item.postName,
  }))
}

/** 更新职位编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化职位 */
function format(value?: number | null) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
