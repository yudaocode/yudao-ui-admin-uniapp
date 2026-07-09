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

  <WorkshopPicker ref="pickerRef" @confirm="handleConfirm" />
</template>

<script lang="ts" setup>
import type { MdWorkshop } from '@/api/mes/md/workstation/workshop'
import { computed, ref, watch } from 'vue'
import { getWorkshop } from '@/api/mes/md/workstation/workshop'
import WorkshopPicker from './workshop-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '车间',
  placeholder: '请选择车间',
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MdWorkshop | undefined]
  'clear': []
}>()

const pickerRef = ref<InstanceType<typeof WorkshopPicker>>() // 车间选择器
const selectedItem = ref<MdWorkshop>() // 当前车间
const displayValue = computed(() => format(props.modelValue))

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open()
}

/** 确认车间 */
function handleConfirm(item: MdWorkshop) {
  selectedItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 清空车间 */
function handleClear() {
  selectedItem.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}

/** 格式化车间编号 */
function format(id?: number | string) {
  if (id == null || id === '') {
    return ''
  }
  if (selectedItem.value?.id === Number(id)) {
    return selectedItem.value.code || selectedItem.value.name || String(id)
  }
  return String(id)
}

/** 加载车间回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getWorkshop(id)
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
