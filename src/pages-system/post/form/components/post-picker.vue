<template>
  <wd-select-picker
    v-model="selectedIds"
    label="岗位"
    label-width="180rpx"
    :columns="columns"
    type="checkbox"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Post } from '@/api/system/post'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimplePostList } from '@/api/system/post'

const props = defineProps<{
  modelValue?: number[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const postList = ref<Post[]>([])
const selectedIds = ref<number[]>([])

/** 构建 columns 数据 */
const columns = computed(() => {
  return postList.value.map(item => ({
    label: item.name,
    value: item.id,
  }))
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

function handleConfirm({ value }: { value: number[] }) {
  emit('update:modelValue', value)
}

onMounted(() => {
  loadPostList()
})
</script>
