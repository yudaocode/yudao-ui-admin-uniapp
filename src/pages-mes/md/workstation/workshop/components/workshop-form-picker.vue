<template>
  <yd-form-picker
    :model-value="modelValue"
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
import type { MdWorkshop } from '@/api/mes/md/workstation/workshop'
import { ref, watch } from 'vue'
import { getWorkshopSimpleList } from '@/api/mes/md/workstation/workshop'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '车间',
  labelWidth: '220rpx',
  placeholder: '请选择车间',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MdWorkshop | undefined]
}>()

const options = ref<MdWorkshop[]>([]) // 车间选项

/** 加载车间选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getWorkshopSimpleList() || []
}

/** 打开前加载选项 */
async function beforeOpenPicker() {
  await loadOptions()
}

/** 更新车间编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择车间 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空车间 */
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
