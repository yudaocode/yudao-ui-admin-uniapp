<template>
  <wd-cell :title="label" :value="displayValue" is-link center @click="pickerRef?.open()" />
  <FriendPicker
    ref="pickerRef"
    v-model="modelValue"
    :locked-ids="lockedIds"
    :disabled-ids="disabledIds"
    :hide-ids="hideIds"
    :max-size="maxSize"
    @confirm="emit('confirm', $event)"
  />
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useSelectedItems } from '../../composables/useSelectedItems'
import { useFriendStore } from '../../store/friendStore'
import FriendPicker from './friend-picker.vue'

const props = withDefaults(defineProps<{
  modelValue: number[]
  label?: string
  lockedIds?: number[]
  disabledIds?: number[]
  hideIds?: number[]
  maxSize?: number
}>(), {
  label: '好友',
  lockedIds: () => [],
  disabledIds: () => [],
  hideIds: () => [],
  maxSize: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  'confirm': [value: number[]]
}>()

const friendStore = useFriendStore()
const { getActiveFriendLiteList } = storeToRefs(friendStore)
const pickerRef = ref<InstanceType<typeof FriendPicker>>() // 好友选择器引用
const friendById = computed(() => new Map(getActiveFriendLiteList.value
  .map(friend => [friend.id, friend]))) // 好友编号索引
const { selectedCount } = useSelectedItems(
  () => props.modelValue,
  () => props.lockedIds,
  () => props.disabledIds,
  () => props.hideIds,
  friendById,
)
const modelValue = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
const displayValue = computed(() => selectedCount.value > 0
  ? `已选择 ${selectedCount.value} 人`
  : '请选择') // 表单行展示文案
</script>
