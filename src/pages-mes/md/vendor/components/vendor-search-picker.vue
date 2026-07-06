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

  <VendorPicker ref="pickerRef" :title="title" :multiple="false" @confirm="handleConfirm" />
</template>

<script lang="ts" setup>
import type { MdVendor } from '@/api/mes/md/vendor'
import { computed, ref, watch } from 'vue'
import { getVendor } from '@/api/mes/md/vendor'
import VendorPicker from './vendor-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  title?: string
}>(), {
  label: '供应商',
  placeholder: '请选择供应商',
  disabled: false,
  clearable: true,
  title: '选择供应商',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MdVendor | undefined]
  'clear': []
}>()

const pickerRef = ref<InstanceType<typeof VendorPicker>>() // 供应商选择器
const selectedItem = ref<MdVendor>() // 当前供应商
const displayValue = computed(() => {
  return format(props.modelValue)
})

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open()
}

/** 确认供应商 */
function handleConfirm(items: MdVendor[]) {
  const item = items[0]
  if (!item || item.id == null) {
    return
  }
  selectedItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 清空供应商 */
function handleClear() {
  selectedItem.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}

/** 格式化供应商编号 */
function format(id?: number | string) {
  if (id == null || id === '') {
    return ''
  }
  if (selectedItem.value?.id === Number(id)) {
    return selectedItem.value.code || selectedItem.value.nickname || selectedItem.value.name || String(id)
  }
  return String(id)
}

/** 加载供应商回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getVendor(id)
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
