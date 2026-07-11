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

  <WorkstationPicker
    ref="pickerRef"
    :model-value="modelValue"
    :clearable="clearable"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { MdWorkstation } from '@/api/mes/md/workstation'
import { computed, ref, watch } from 'vue'
import { getWorkstation } from '@/api/mes/md/workstation'
import WorkstationPicker from './workstation-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '工作站',
  placeholder: '请选择工作站',
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MdWorkstation | undefined]
  'clear': []
}>()

const pickerRef = ref<InstanceType<typeof WorkstationPicker>>() // 工作站选择器
const selectedItem = ref<MdWorkstation>() // 当前工作站
const displayValue = computed(() => {
  return format(props.modelValue)
})

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open(props.modelValue)
}

/** 确认工作站 */
function handleConfirm(item: MdWorkstation) {
  selectedItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 清空工作站 */
function handleClear() {
  selectedItem.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}

/** 格式化工作站编号 */
function format(id?: number | string) {
  if (id == null || id === '') {
    return ''
  }
  if (selectedItem.value?.id === Number(id)) {
    return selectedItem.value.code || selectedItem.value.name || String(id)
  }
  return String(id)
}

/** 加载工作站回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    const item = await getWorkstation(id)
    if (props.modelValue === id) {
      selectedItem.value = item
    }
  } catch {
    if (props.modelValue === id) {
      selectedItem.value = undefined
    }
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
