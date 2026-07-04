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
    v-model="selectedId"
    v-model:visible="visible"
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
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'confirm', account?: Account): void
  (e: 'change', account?: Account): void
}>()

const accountList = ref<Account[]>([]) // 结算账户列表
const selectedId = ref<number | string>('') // 当前选中账户编号
const visible = ref(false) // 选择器显示状态

const selectedLabel = computed(() => {
  if (!selectedId.value) {
    return ''
  }
  return accountList.value.find(item => item.id === Number(selectedId.value))?.name || ''
})

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

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  visible.value = true
}

/** 加载结算账户列表 */
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

defineExpose({
  loadAccountList,
  selectedLabel,
})

/** 初始化 */
onMounted(() => {
  loadAccountList()
})
</script>
