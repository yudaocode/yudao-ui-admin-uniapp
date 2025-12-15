<template>
  <wd-select-picker
    v-model="selectedId"
    :label="label"
    label-width="180rpx"
    :columns="columns"
    :type="type"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleUserList } from '@/api/system/user'

const props = withDefaults(defineProps<{
  modelValue?: number | number[]
  type?: 'radio' | 'checkbox'
  label?: string
}>(), {
  type: 'checkbox',
  label: '负责人'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | number[] | undefined): void
}>()

const userList = ref<User[]>([])
const selectedId = ref<number | string | number[]>([])

// 构建 columns 数据
const columns = computed(() => {
  return userList.value.map(user => ({
    label: user.nickname,
    value: user.id
  }))
})

watch(
  () => props.modelValue,
  (val) => {
    if (props.type === 'radio') {
      // 单选时，如果值为 undefined，使用空字符串避免警告
      selectedId.value = val !== undefined ? val : ''
    } else {
      // 多选时，确保是数组
      selectedId.value = Array.isArray(val) ? val : []
    }
  },
  { immediate: true }
)

async function loadUserList() {
  userList.value = await getSimpleUserList()
}

function handleConfirm({ value }: { value: any }) {
  emit('update:modelValue', value)
}

onMounted(() => {
  loadUserList()
})
</script>
