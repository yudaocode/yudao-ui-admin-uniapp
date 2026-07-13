<template>
  <view class="yd-search-form-item">
    <!-- 表情包搜索选择入口 -->
    <view class="yd-search-form-label">
      {{ label }}
    </view>
    <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx" @click="handleOpen">
      <text class="min-w-0 flex-1 truncate" :class="displayValue ? 'text-[#333]' : 'text-[#999]'">
        {{ displayValue || placeholder }}
      </text>
      <wd-icon
        v-if="clearable && !disabled && modelValue"
        name="close-circle"
        size="30rpx"
        custom-style="color: #c0c4cc;"
        @click.stop="handleClear"
      />
      <wd-icon v-else name="arrow-right" size="28rpx" color="#c0c4cc" />
    </view>

    <!-- 表情包选择弹窗 -->
    <PackPicker ref="pickerRef" @confirm="handleConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerFacePackVO } from '@/api/im/manager/face/pack'
import { computed, ref, watch } from 'vue'
import { getManagerFacePack } from '@/api/im/manager/face/pack'
import PackPicker from './pack-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
}>(), {
  label: '表情包',
  placeholder: '请选择表情包',
  clearable: true,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [pack: ImManagerFacePackVO | undefined]
}>()

const pickerRef = ref<InstanceType<typeof PackPicker>>() // 表情包选择器
const selectedPack = ref<ImManagerFacePackVO>() // 当前表情包
const displayValue = computed(() => selectedPack.value?.name || (props.modelValue ? String(props.modelValue) : '')) // 表情包展示文案

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

/** 清空表情包 */
function handleClear() {
  selectedPack.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
}

/** 加载表情包回显 */
async function loadSelected(id?: number) {
  if (!id) {
    selectedPack.value = undefined
    return
  }
  if (selectedPack.value?.id === id) {
    return
  }
  const pack = await getManagerFacePack(id)
  if (props.modelValue === id) {
    selectedPack.value = pack
  }
}

/** 格式化表情包 */
function format(value?: number) {
  return !value || value === props.modelValue ? displayValue.value : `表情包 ${value}`
}

/** 监听表情包编号变化 */
watch(() => props.modelValue, loadSelected, { immediate: true })

defineExpose({ format })
</script>
