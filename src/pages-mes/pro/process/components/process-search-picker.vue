<template>
  <view class="yd-search-form-item">
    <view class="yd-search-form-label">
      {{ label }}
    </view>
    <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx" @click="handleOpen">
      <text class="min-w-0 flex-1 truncate" :class="displayValue ? 'text-[#333]' : 'text-[#999]'">
        {{ displayValue || placeholder }}
      </text>
      <wd-icon
        v-if="clearable && displayValue"
        name="close-circle"
        size="30rpx"
        custom-style="color: #c0c4cc;"
        @click.stop="handleClear"
      />
    </view>
  </view>

  <ProcessPicker
    ref="pickerRef"
    :model-value="modelValue"
    :clearable="clearable"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { ProProcess } from '@/api/mes/pro/process'
import { computed, ref, watch } from 'vue'
import { getProcess } from '@/api/mes/pro/process'
import ProcessPicker from './process-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '工序',
  placeholder: '请选择工序',
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProProcess | undefined]
  'clear': []
}>()

const pickerRef = ref<InstanceType<typeof ProcessPicker>>() // 工序选择器
const selectedItem = ref<ProProcess>() // 当前工序
const displayValue = computed(() => format(props.modelValue))

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open(props.modelValue)
}

/** 确认工序 */
function handleConfirm(item: ProProcess) {
  selectedItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 清空工序 */
function handleClear() {
  selectedItem.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}

/** 格式化工序编号 */
function format(id?: number | string) {
  if (id == null || id === '') {
    return ''
  }
  if (selectedItem.value?.id === Number(id)) {
    return selectedItem.value.code || selectedItem.value.name || String(id)
  }
  return String(id)
}

/** 加载工序回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getProcess(id)
  } catch {
    selectedItem.value = undefined
  }
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  value => resolveItem(value),
  { immediate: true },
)

defineExpose({ format })
</script>
