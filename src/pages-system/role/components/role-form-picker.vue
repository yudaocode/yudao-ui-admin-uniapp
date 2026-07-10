<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    :before-open="ensureOptions"
    filterable
    @update:model-value="handleUpdate"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { Role } from '@/api/system/role'
import { onMounted, ref } from 'vue'
import { getSimpleRoleList } from '@/api/system/role'

withDefaults(defineProps<{
  modelValue?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '角色',
  labelWidth: '220rpx',
  placeholder: '请选择角色',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Role | undefined]
}>()

const options = ref<Role[]>([]) // 角色选项

/** 加载角色选项 */
async function loadOptions() {
  try {
    options.value = await getSimpleRoleList()
  } catch {
    options.value = []
  }
}

/** 打开前确保角色选项 */
function ensureOptions() {
  if (options.value.length === 0) {
    loadOptions()
  }
}

/** 更新角色编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 清空角色 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
