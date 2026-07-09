<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    :before-open="beforeOpenPicker"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { DvMachineryType } from '@/api/mes/dv/machinery/type'
import { ref, watch } from 'vue'
import { getMachineryTypeSimpleList } from '@/api/mes/dv/machinery/type'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '设备类型',
  labelWidth: '220rpx',
  placeholder: '请选择设备类型',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: DvMachineryType | undefined]
}>()

const options = ref<DvMachineryType[]>([]) // 设备类型选项

/** 加载设备类型选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getMachineryTypeSimpleList() || []
}

/** 打开前加载选项 */
async function beforeOpenPicker() {
  await loadOptions()
}

/** 更新设备类型编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择设备类型 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空设备类型 */
function handleClear() {
  emit('change', undefined)
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
</script>
