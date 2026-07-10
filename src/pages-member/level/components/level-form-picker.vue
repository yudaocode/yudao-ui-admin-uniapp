<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :clearable="clearable"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { MemberLevel } from '@/api/member/level'
import { onMounted, ref } from 'vue'
import { getSimpleMemberLevelList } from '@/api/member/level'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  clearable?: boolean
}>(), {
  label: '用户等级',
  labelWidth: '180rpx',
  placeholder: '请选择用户等级',
  prop: '',
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MemberLevel | undefined]
}>()

const options = ref<MemberLevel[]>([]) // 用户等级选项

/** 加载用户等级选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getSimpleMemberLevelList()
}

/** 更新用户等级编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择用户等级 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(option => option.id === value))
}

/** 清空用户等级 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
