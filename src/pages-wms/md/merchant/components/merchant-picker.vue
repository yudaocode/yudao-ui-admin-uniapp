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
    :columns="merchantList"
    value-key="id"
    label-key="name"
    type="radio"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Merchant } from '@/api/wms/md/merchant'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleMerchantList } from '@/api/wms/md/merchant'
import { WmsCustomerMerchantTypeList, WmsSupplierMerchantTypeList } from '@/utils/constants'

const props = withDefaults(defineProps<{
  customer?: boolean
  disabled?: boolean
  label?: string
  labelWidth?: string
  modelValue?: number
  placeholder?: string
  prop?: string
  supplier?: boolean
}>(), {
  customer: false,
  disabled: false,
  label: '往来企业',
  labelWidth: '180rpx',
  placeholder: '请选择往来企业',
  prop: '',
  supplier: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'confirm', merchant?: Merchant): void
  (e: 'change', merchant?: Merchant): void
}>()

const merchantList = ref<Merchant[]>([]) // 往来企业列表
const selectedId = ref<number | string>('') // 当前选中企业编号
const visible = ref(false) // 选择器显示状态

const selectedLabel = computed(() => {
  if (!selectedId.value) {
    return ''
  }
  return merchantList.value.find(item => item.id === Number(selectedId.value))?.name || ''
})

watch(
  () => props.modelValue,
  (value) => {
    selectedId.value = value ?? ''
  },
  { immediate: true },
)

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  visible.value = true
}

/** 加载往来企业列表 */
async function loadMerchantList() {
  const types = props.supplier
    ? WmsSupplierMerchantTypeList
    : props.customer
      ? WmsCustomerMerchantTypeList
      : undefined
  merchantList.value = await getSimpleMerchantList(types ? { types } : undefined)
}

/** 选择确认 */
function handleConfirm({ value }: { value: any }) {
  const merchantId = value ? Number(value) : undefined
  const merchant = merchantList.value.find(item => item.id === merchantId)
  emit('update:modelValue', merchantId)
  emit('confirm', merchant)
  emit('change', merchant)
}

/** 初始化 */
onMounted(() => {
  loadMerchantList()
})
</script>
