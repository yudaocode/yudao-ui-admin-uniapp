<template>
  <yd-search-picker
    :model-value="modelValue"
    label="科目"
    :columns="columns"
    all-option
    all-label="全部科目"
    placeholder="请选择科目"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { Subject } from '@/api/fms/config/subject'
import { getSubjectSimpleList } from '@/api/fms/config/subject'
import { useFmsStore } from '@/pages-fms/store/fms'
import { buildFmsSubjectOptions } from '@/pages-fms/utils/format'

defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Subject | undefined] // 选中项变化，供父级拼接搜索文案
}>()

const fmsStore = useFmsStore()
const subjects = ref<Subject[]>([]) // 科目选项来源

const columns = computed(() => buildFmsSubjectOptions(subjects.value, true)) // 科目选项：编码 + 名称平铺，按编码排序

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
  emit('change', subjects.value.find(item => item.id === value))
}

/** 账套变化时刷新科目选项 */
watch(() => fmsStore.accountSet?.id, async () => {
  const accountSetId = fmsStore.accountSet?.id
  subjects.value = accountSetId ? await getSubjectSimpleList(accountSetId) : []
}, { immediate: true })
</script>
