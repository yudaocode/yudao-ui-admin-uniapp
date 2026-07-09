<template>
  <yd-search-picker
    :model-value="pickerValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    all-option
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { TmToolType } from '@/api/mes/tm/tool/type'
import { computed, onMounted, ref, watch } from 'vue'
import { getToolTypeSimpleList } from '@/api/mes/tm/tool/type'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '工具类型',
  placeholder: '请选择工具类型',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: TmToolType | undefined]
}>()

const options = ref<TmToolType[]>([]) // 工具类型选项
const pickerValue = computed(() => props.modelValue ?? -1)

/** 加载工具类型选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getToolTypeSimpleList() || []
}

/** 更新工具类型编号 */
function handleUpdate(value: number) {
  const toolTypeId = value === -1 ? undefined : value
  emit('update:modelValue', toolTypeId)
  emit('change', options.value.find(item => item.id === toolTypeId))
}

/** 格式化工具类型编号 */
function format(id?: number | string) {
  if (id == null || id === '') {
    return ''
  }
  return options.value.find(item => item.id === Number(id))?.name || String(id)
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  (value) => {
    if (value != null) {
      loadOptions()
    }
  },
  { immediate: true },
)

/** 初始化 */
onMounted(() => {
  loadOptions()
})

defineExpose({ format })
</script>
