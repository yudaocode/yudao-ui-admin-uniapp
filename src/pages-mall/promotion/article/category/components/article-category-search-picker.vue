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
import type { PromotionArticleCategory } from '@/api/mall/promotion/article-category'
import { onMounted, ref } from 'vue'
import { getSimplePromotionArticleCategoryList } from '@/api/mall/promotion/article-category'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '文章分类',
  placeholder: '请选择文章分类',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: PromotionArticleCategory | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<PromotionArticleCategory[]>([]) // 文章分类选项

/** 更新文章分类 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化文章分类 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimplePromotionArticleCategoryList()
})
</script>
