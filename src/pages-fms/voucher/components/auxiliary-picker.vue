<template>
  <wd-select-picker
    ref="pickerRef"
    v-model="selectedId"
    :title="currentTypeName || '选择辅助核算项目'"
    :columns="options"
    :loading="loading"
    value-key="id"
    label-key="pickerLabel"
    type="radio"
    filterable
    root-portal
    :scroll-into-view="false"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { AuxiliaryItem } from '@/api/fms/config/auxiliary/item'
import { getAuxiliaryItemSimpleList } from '@/api/fms/config/auxiliary/item'

const props = defineProps<{
  accountSetId?: number
}>()

const emit = defineEmits<{
  confirm: [payload: { typeId: number, item: AuxiliaryItem }]
}>()

const loading = ref(false) // 选项加载状态
const selectedId = ref<number | string>('') // 当前选中项目编号
const currentTypeId = ref<number>() // 当前辅助核算类别编号
const currentTypeName = ref('') // 当前辅助核算类别名称
const optionsCache = reactive(new Map<number, AuxiliaryItem[]>()) // 各类别辅助核算项目缓存
const pickerRef = ref<SelectPickerInstance>() // 辅助核算项目选择器
const options = computed(() => // 当前类别的辅助核算项目选项
  (currentTypeId.value ? optionsCache.get(currentTypeId.value) || [] : []).map(item => ({
    ...item,
    pickerLabel: `${item.code} ${item.name}`,
  })),
)

/** 加载辅助核算项目选项 */
async function loadOptions(typeId: number) {
  if (optionsCache.has(typeId) || !props.accountSetId) {
    return
  }
  loading.value = true
  try {
    optionsCache.set(typeId, await getAuxiliaryItemSimpleList(props.accountSetId, typeId))
  } finally {
    loading.value = false
  }
}

/** 打开选择器 */
async function open(typeId: number, typeName: string) {
  currentTypeId.value = typeId
  currentTypeName.value = typeName
  selectedId.value = ''
  await loadOptions(typeId)
  pickerRef.value?.open()
}

/** 选择确认 */
function handleConfirm({ value }: { value?: number | string | null }) {
  const itemId = value ? Number(value) : undefined
  const item = options.value.find(option => option.id === itemId)
  if (!currentTypeId.value || !item) {
    return
  }
  emit('confirm', { typeId: currentTypeId.value, item })
}

/** 账套切换后清空选项缓存 */
watch(
  () => props.accountSetId,
  () => {
    optionsCache.clear()
  },
)

defineExpose({ open })
</script>
