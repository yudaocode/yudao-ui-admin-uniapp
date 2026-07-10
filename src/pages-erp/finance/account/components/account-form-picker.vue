<template>
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :disabled="disabled"
    is-link
    :value="selectedLabel"
    :placeholder="placeholder"
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
import type { Account } from '@/api/erp/finance/account'
import { computed, onMounted, ref, watch } from 'vue'
import { getAccountSimpleList } from '@/api/erp/finance/account'

const props = withDefaults(defineProps<{
  autoDefault?: boolean
  disabled?: boolean
  label?: string
  labelWidth?: string
  modelValue?: number
  placeholder?: string
  prop?: string
}>(), {
  autoDefault: false,
  disabled: false,
  label: '结算账户',
  labelWidth: '220rpx',
  placeholder: '请选择结算账户',
  prop: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'confirm': [account: Account | undefined]
  'change': [account: Account | undefined]
}>()

const accountList = ref<Account[]>([]) // 结算账户选项
const selectedId = ref<number | string>('') // 当前选中账户编号
const pickerRef = ref<SelectPickerInstance>() // 结算账户选择器
const selectedLabel = computed(() => format())

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open()
}

/** 加载结算账户选项 */
async function loadAccountList() {
  accountList.value = await getAccountSimpleList()
  applyDefaultSelectedAccount()
}

/** 应用默认账户 */
function applyDefaultSelectedAccount() {
  if (!props.autoDefault || selectedId.value) {
    return
  }
  const defaultAccount = accountList.value.find(item => item.defaultStatus)
  if (defaultAccount?.id) {
    selectedId.value = defaultAccount.id
    emit('update:modelValue', defaultAccount.id)
  }
}

/** 选择确认 */
function handleConfirm({ value }: { value?: number | string | null }) {
  const accountId = value ? Number(value) : undefined
  const account = accountList.value.find(item => item.id === accountId)
  emit('update:modelValue', accountId)
  emit('confirm', account)
  emit('change', account)
}

/** 格式化结算账户 */
function format(value?: number | string) {
  const accountId = arguments.length > 0 ? Number(value) : Number(selectedId.value)
  return accountList.value.find(item => item.id === accountId)?.name || ''
}

watch(
  () => props.modelValue,
  (value) => {
    selectedId.value = value ?? ''
  },
  { immediate: true },
)

watch(
  () => props.autoDefault,
  () => {
    applyDefaultSelectedAccount()
  },
)

defineExpose({ format, loadAccountList })

/** 初始化 */
onMounted(() => {
  loadAccountList()
})
</script>
