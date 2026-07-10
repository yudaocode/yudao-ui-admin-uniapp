<!-- 公众号账号选择器：单元格入口 + 弹层选择当前操作的公众号，供 mp 各页顶部切换账号 -->
<template>
  <wd-cell
    :title="label"
    is-link
    :value="selectedLabel || placeholder"
    @click="handleOpen"
  />
  <wd-select-picker
    ref="pickerRef"
    v-model="selectedId"
    :title="label"
    :columns="accountList"
    value-key="id"
    label-key="name"
    type="radio"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { AccountSimple } from '@/api/mp/account'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleAccountList } from '@/api/mp/account'

const props = withDefaults(defineProps<{
  modelValue?: number | string
  label?: string
  placeholder?: string
}>(), {
  label: '公众号',
  placeholder: '请选择公众号',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'change', id: number, name: string): void
}>()

const toast = useToast()
const accountList = ref<AccountSimple[]>([]) // 公众号列表
const selectedId = ref<number | string>('')
const pickerRef = ref<SelectPickerInstance>() // 公众号选择器

const selectedLabel = computed(() => {
  const id = Number(selectedId.value)
  return accountList.value.find(item => item.id === id)?.name || ''
})

watch(
  () => props.modelValue,
  (val) => {
    selectedId.value = val || ''
  },
  { immediate: true },
)

/** 加载公众号列表 */
async function loadAccountList() {
  try {
    accountList.value = await getSimpleAccountList()
  } catch {
    accountList.value = []
    return
  }
  if (accountList.value.length === 0) {
    toast.show('请先配置公众号账号')
    return
  }
  if (!selectedId.value) {
    const first = accountList.value[0]
    selectedId.value = first.id
    emit('update:modelValue', first.id)
    emit('change', first.id, first.name)
  }
}

/** 确认选择 */
function handleConfirm({ value }: { value: number | string }) {
  const id = Number(value)
  const account = accountList.value.find(item => item.id === id)
  selectedId.value = id
  emit('update:modelValue', id)
  emit('change', id, account?.name || '')
}

/** 打开公众号选择器 */
function handleOpen() {
  pickerRef.value?.open()
}

/** 初始化 */
onMounted(() => {
  loadAccountList()
})
</script>
