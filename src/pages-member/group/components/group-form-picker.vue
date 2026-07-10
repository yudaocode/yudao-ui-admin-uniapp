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
import type { MemberGroup } from '@/api/member/group'
import { onMounted, ref } from 'vue'
import { getSimpleMemberGroupList } from '@/api/member/group'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  clearable?: boolean
}>(), {
  label: '用户分组',
  labelWidth: '180rpx',
  placeholder: '请选择用户分组',
  prop: '',
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MemberGroup | undefined]
}>()

const options = ref<MemberGroup[]>([]) // 用户分组选项

/** 加载用户分组选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getSimpleMemberGroupList()
}

/** 更新用户分组编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择用户分组 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(option => option.id === value))
}

/** 清空用户分组 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
