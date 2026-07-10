<template>
  <wd-form-item
    title="岗位"
    title-width="180rpx"
    is-link
    :value="selectedLabel"
    placeholder="请选择岗位"
    @click="openPicker"
  />
  <wd-select-picker
    ref="pickerRef"
    v-model="selectedIds"
    :visible="visible"
    title="请选择岗位"
    :columns="postList"
    value-key="id"
    label-key="name"
    type="checkbox"
    filterable
    @update:visible="handleVisibleChange"
    @update:model-value="handleChange"
  />
</template>

<script lang="ts" setup>
import type { Post } from '@/api/system/post'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimplePostList } from '@/api/system/post'
import { useWotSelectPicker } from '@/hooks/useWotSelectPicker'

const props = defineProps<{
  modelValue?: number[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const postList = ref<Post[]>([])
const selectedIds = ref<number[]>([])
const { pickerRef, visible, openPicker, handleVisibleChange } = useWotSelectPicker()

const selectedLabel = computed(() => {
  if (selectedIds.value.length === 0) {
    return ''
  }
  return selectedIds.value
    .map(id => postList.value.find(post => post.id === id)?.name)
    .filter(Boolean)
    .join('、')
})

watch(
  () => props.modelValue,
  (val) => {
    selectedIds.value = val || []
  },
  { immediate: true },
)

async function loadPostList() {
  postList.value = await getSimplePostList()
}

function handleChange(value: Array<boolean | number | string>) {
  emit('update:modelValue', value.map(Number))
}

onMounted(() => {
  loadPostList()
})
</script>
