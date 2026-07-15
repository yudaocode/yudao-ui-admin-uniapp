<template>
  <wd-cell :title="label" :value="displayValue" is-link center @click="pickerRef?.open()" />
  <FriendPicker
    ref="pickerRef"
    v-model="modelValue"
    :locked-ids="lockedIds"
    :disabled-ids="disabledIds"
    :max-size="maxSize"
    @confirm="emit('confirm', $event)"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import FriendPicker from './friend-picker.vue'

const props = withDefaults(defineProps<{
  modelValue: number[]
  label?: string
  lockedIds?: number[]
  disabledIds?: number[]
  maxSize?: number
}>(), {
  label: '好友',
  lockedIds: () => [],
  disabledIds: () => [],
  maxSize: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  'confirm': [value: number[]]
}>()

const pickerRef = ref<InstanceType<typeof FriendPicker>>() // 好友选择器引用
const modelValue = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
const displayValue = computed(() => props.modelValue.length > 0
  ? `已选择 ${props.modelValue.length} 人`
  : '请选择') // 表单行展示文案
</script>
