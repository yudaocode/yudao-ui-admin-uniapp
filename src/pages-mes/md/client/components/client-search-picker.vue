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

  <ClientPicker ref="pickerRef" :title="title" :multiple="false" @confirm="handleConfirm" />
</template>

<script lang="ts" setup>
import type { MdClient } from '@/api/mes/md/client'
import { computed, ref, watch } from 'vue'
import { getClient } from '@/api/mes/md/client'
import ClientPicker from './client-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  title?: string
}>(), {
  label: '客户',
  placeholder: '请选择客户',
  disabled: false,
  clearable: true,
  title: '选择客户',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MdClient | undefined]
  'clear': []
}>()

const pickerRef = ref<InstanceType<typeof ClientPicker>>() // 客户选择器
const selectedItem = ref<MdClient>() // 当前客户
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

/** 确认客户 */
function handleConfirm(items: MdClient[]) {
  const item = items[0]
  if (!item || item.id == null) {
    return
  }
  selectedItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 清空客户 */
function handleClear() {
  selectedItem.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}

/** 格式化客户编号 */
function format(id?: number | string) {
  if (id == null || id === '') {
    return ''
  }
  if (selectedItem.value?.id === Number(id)) {
    return selectedItem.value.code || selectedItem.value.nickname || selectedItem.value.name || String(id)
  }
  return String(id)
}

/** 加载客户回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getClient(id)
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
