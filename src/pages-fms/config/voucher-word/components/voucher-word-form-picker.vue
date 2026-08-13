<template>
  <yd-form-picker
    :model-value="modelValue"
    label="凭证字"
    :label-width="labelWidth"
    :prop="prop"
    :columns="columns"
    placeholder="请选择凭证字"
    :disabled="disabled"
    @update:model-value="handleUpdate"
    @confirm="emit('confirm', $event)"
  />
</template>

<script lang="ts" setup>
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import { getVoucherWordSimpleList } from '@/api/fms/config/voucher-word'
import { useFmsStore } from '@/pages-fms/store/fms'
import { buildFmsVoucherWordOptions } from '@/pages-fms/utils/format'

withDefaults(defineProps<{
  modelValue?: number
  labelWidth?: string
  prop?: string
  disabled?: boolean
}>(), {
  labelWidth: '220rpx',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'confirm': [value: any]
}>()

const fmsStore = useFmsStore()
const voucherWords = ref<VoucherWord[]>([]) // 凭证字选项来源

const columns = computed(() => buildFmsVoucherWordOptions(voucherWords.value)) // 凭证字选项

/** 更新选中值，并回传选中项 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
}

/** 账套变化时刷新凭证字选项 */
watch(() => fmsStore.accountSet?.id, async () => {
  const accountSetId = fmsStore.accountSet?.id
  voucherWords.value = accountSetId ? await getVoucherWordSimpleList(accountSetId) : []
}, { immediate: true })
</script>
