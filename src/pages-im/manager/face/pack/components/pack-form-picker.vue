<template>
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :is-link="!disabled"
    :value="displayValue"
    :placeholder="placeholder"
    @click="handleOpen"
  />

  <PackPicker ref="pickerRef" @confirm="handleConfirm" />
</template>

<script lang="ts" setup>
import type { ImManagerFacePackVO } from '@/api/im/manager/face/pack'
import { computed, ref, watch } from 'vue'
import { getManagerFacePack } from '@/api/im/manager/face/pack'
import PackPicker from './pack-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '表情包',
  labelWidth: '220rpx',
  placeholder: '请选择表情包',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [pack: ImManagerFacePackVO | undefined]
}>()

const pickerRef = ref<InstanceType<typeof PackPicker>>() // 表情包选择器
const selectedPack = ref<ImManagerFacePackVO>() // 当前表情包
const displayValue = computed(() => selectedPack.value?.name || (props.modelValue ? String(props.modelValue) : ''))

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open(selectedPack.value)
}

/** 选择表情包 */
function handleConfirm(pack: ImManagerFacePackVO) {
  if (pack.id == null) {
    return
  }
  selectedPack.value = pack
  emit('update:modelValue', pack.id)
  emit('change', pack)
}

/** 加载表情包回显 */
async function resolvePack(id?: number) {
  if (!id) {
    selectedPack.value = undefined
    return
  }
  if (selectedPack.value?.id === id) {
    return
  }
  try {
    const pack = await getManagerFacePack(id)
    if (props.modelValue === id) {
      selectedPack.value = pack
    }
  } catch {
    if (props.modelValue === id) {
      selectedPack.value = undefined
    }
  }
}

watch(
  () => props.modelValue,
  value => resolvePack(value),
  { immediate: true },
)
</script>
