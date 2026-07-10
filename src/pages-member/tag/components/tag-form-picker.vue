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
    type="checkbox"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { MemberTag } from '@/api/member/tag'
import { onMounted, ref } from 'vue'
import { getSimpleMemberTagList } from '@/api/member/tag'

const props = withDefaults(defineProps<{
  modelValue?: number[]
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  clearable?: boolean
}>(), {
  label: '用户标签',
  labelWidth: '180rpx',
  placeholder: '请选择用户标签',
  prop: '',
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const options = ref<MemberTag[]>([]) // 用户标签选项

/** 加载用户标签选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getSimpleMemberTagList()
}

/** 更新用户标签编号 */
function handleUpdate(value?: number[]) {
  emit('update:modelValue', Array.isArray(value) ? value.map(Number) : [])
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
