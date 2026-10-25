<!-- 商品分类选择器：单选，自加载分类列表，回写 categoryId 给父组件 -->
<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :columns="options"
    :placeholder="placeholder"
    :disabled="disabled"
    @update:model-value="value => emit('update:modelValue', Number(value))"
  />
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import { onMounted, ref } from 'vue'
import { getProductCategoryList } from '@/api/mall/product/category'

withDefaults(defineProps<{
  modelValue?: number // 已选分类编号
  label?: string // 字段标题
  labelWidth?: string // 标题宽度
  prop?: string // wd-form 校验字段名
  placeholder?: string // 未选择时占位
  disabled?: boolean // 是否禁用
}>(), {
  label: '商品分类',
  labelWidth: '200rpx',
  prop: '',
  placeholder: '请选择商品分类',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const options = ref<{ label: string, value: number }[]>([]) // 商品分类选项

/** 加载商品分类列表（回显需要据此解析名称） */
onMounted(async () => {
  const list = await getProductCategoryList({})
  options.value = list.map(item => ({ label: item.name || String(item.id), value: parseId(item.id) as number }))
})
</script>
