<template>
  <view @click="handleOpen">
    <slot />
  </view>

  <wd-select-picker
    ref="pickerRef"
    v-model="selectedId"
    :visible="visible"
    :title="title"
    :columns="pickerOptions"
    value-key="id"
    label-key="name"
    type="radio"
    filterable
    @update:visible="handleVisibleChange"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Business } from '@/api/crm/business'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleBusinessList } from '@/api/crm/business'
import { useWotSelectPicker } from '@/hooks/useWotSelectPicker'

const props = withDefaults(defineProps<{
  modelValue?: number
  customerId?: number
  title?: string
  disabled?: boolean
}>(), {
  title: '选择商机',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'confirm': [item: Business | undefined]
}>()

const options = ref<Business[]>([]) // 商机选项
const selectedId = ref<number | string>(props.modelValue ?? '') // 当前商机编号
const { pickerRef, visible, openPicker, handleVisibleChange } = useWotSelectPicker()
const pickerOptions = computed(() => { // 当前客户下的商机
  return props.customerId
    ? options.value.filter(item => item.customerId === props.customerId)
    : options.value
})

/** 加载商机选项 */
async function loadOptions() {
  options.value = (await getSimpleBusinessList()).filter(item => item.id != null)
}

/** 打开选择器 */
function handleOpen() {
  if (!props.disabled) {
    openPicker()
  }
}

/** 确认商机 */
function handleConfirm({ value }: { value: any }) {
  const item = pickerOptions.value.find(option => `${option.id}` === `${value}`)
  emit('update:modelValue', item?.id)
  emit('confirm', item)
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  value => selectedId.value = value ?? '',
  { immediate: true },
)

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
