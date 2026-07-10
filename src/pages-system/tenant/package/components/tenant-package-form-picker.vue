<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { TenantPackage } from '@/api/system/tenant/package'
import { onMounted, ref } from 'vue'
import { getTenantPackageList } from '@/api/system/tenant/package'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '租户套餐',
  labelWidth: '200rpx',
  placeholder: '请选择租户套餐',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: TenantPackage | undefined]
}>()

const options = ref<TenantPackage[]>([]) // 租户套餐选项
let loadingPromise: Promise<void> | undefined // 加载中的套餐请求

/** 加载租户套餐选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  if (!loadingPromise) {
    loadingPromise = getTenantPackageList()
      .then((data) => {
        options.value = data
      })
      .finally(() => {
        loadingPromise = undefined
      })
  }
  await loadingPromise
}

/** 更新租户套餐编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
