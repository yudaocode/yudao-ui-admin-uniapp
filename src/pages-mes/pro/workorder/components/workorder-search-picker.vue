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

  <WorkOrderPicker
    ref="pickerRef"
    :model-value="modelValue"
    :confirmed-only="confirmedOnly"
    :type="type"
    :disabled="disabled"
    :title="title"
    :empty-tip="emptyTip"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import { computed, ref, watch } from 'vue'
import { getWorkOrder } from '@/api/mes/pro/workorder'
import WorkOrderPicker from './workorder-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  confirmedOnly?: boolean
  type?: number
  title?: string
  emptyTip?: string
}>(), {
  label: '生产工单',
  placeholder: '请选择生产工单',
  disabled: false,
  clearable: true,
  confirmedOnly: true,
  title: '选择生产工单',
  emptyTip: '暂无已确认工单',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProWorkOrder | undefined]
  'clear': []
}>()

const pickerRef = ref<InstanceType<typeof WorkOrderPicker>>() // 工单选择器
const selectedItem = ref<ProWorkOrder>() // 当前工单
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

/** 更新工单编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择工单 */
function handleChange(item?: ProWorkOrder) {
  selectedItem.value = item
  emit('change', item)
}

/** 格式化工单编号 */
function format(id?: number | string) {
  if (id == null || id === '') {
    return ''
  }
  if (selectedItem.value?.id === Number(id)) {
    return selectedItem.value.code || selectedItem.value.name || String(id)
  }
  return String(id)
}

/** 清空工单 */
function handleClear() {
  selectedItem.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}

/** 加载工单回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    const item = await getWorkOrder(id)
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
