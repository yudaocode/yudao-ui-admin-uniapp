<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    :before-open="ensureOptions"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { Product } from '@/api/erp/product/product'
import { onMounted, ref } from 'vue'
import { getProductSimpleList } from '@/api/erp/product/product'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '产品',
  placeholder: '请选择产品',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Product | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<Product[]>([]) // 产品选项
let loadingPromise: Promise<void> | undefined // 加载中的产品请求

/** 加载产品选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  if (!loadingPromise) {
    loadingPromise = getProductSimpleList()
      .then((data) => {
        options.value = data
      })
      .finally(() => {
        loadingPromise = undefined
      })
  }
  try {
    await loadingPromise
  } catch {
    // 请求层负责提示；保留空选项以便下次打开重试。
  }
}

/** 打开前确保产品选项 */
function ensureOptions() {
  loadOptions()
}

/** 更新产品编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化产品编号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
