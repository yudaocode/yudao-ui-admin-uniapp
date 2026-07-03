<template>
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    is-link
    :value="selectedLabel"
    :placeholder="placeholder"
    @click="visible = true"
  />

  <wd-select-picker
    v-model="selectedId"
    v-model:visible="visible"
    :title="label"
    :columns="brandList"
    value-key="id"
    label-key="name"
    type="radio"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { ItemBrand } from '@/api/wms/md/item/brand'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleItemBrandList } from '@/api/wms/md/item/brand'

const props = withDefaults(defineProps<{
  label?: string
  labelWidth?: string
  modelValue?: number
  placeholder?: string
  prop?: string
}>(), {
  label: '商品品牌',
  labelWidth: '180rpx',
  placeholder: '请选择商品品牌',
  prop: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'confirm', brand?: ItemBrand): void
}>()

const brandList = ref<ItemBrand[]>([]) // 品牌列表
const selectedId = ref<number | string>('') // 当前选中品牌编号
const visible = ref(false) // 选择器显示状态

const selectedLabel = computed(() => {
  if (!selectedId.value) {
    return ''
  }
  return brandList.value.find(item => item.id === Number(selectedId.value))?.name || ''
})

watch(
  () => props.modelValue,
  (value) => {
    selectedId.value = value ?? ''
  },
  { immediate: true },
)

/** 加载品牌列表 */
async function loadBrandList() {
  brandList.value = await getSimpleItemBrandList()
}

/** 选择确认 */
function handleConfirm({ value }: { value: any }) {
  const brandId = value ? Number(value) : undefined
  emit('update:modelValue', brandId)
  emit('confirm', brandList.value.find(item => item.id === brandId))
}

/** 初始化 */
onMounted(() => {
  loadBrandList()
})
</script>
