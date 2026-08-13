<template>
  <yd-search-picker
    :model-value="modelValue"
    label="凭证字"
    :columns="columns"
    all-option
    placeholder="请选择凭证字"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import { getVoucherWordSimpleList } from '@/api/fms/config/voucher-word'
import { useFmsStore } from '@/pages-fms/store/fms'
import { buildFmsVoucherWordOptions } from '@/pages-fms/utils/format'

defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: VoucherWord | undefined] // 选中项变化，供父级拼接搜索文案
}>()

const fmsStore = useFmsStore()
const voucherWords = ref<VoucherWord[]>([]) // 凭证字选项来源

const columns = computed(() => buildFmsVoucherWordOptions(voucherWords.value)) // 凭证字选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
  emit('change', voucherWords.value.find(item => item.id === value))
}

/** 账套变化时刷新凭证字选项 */
watch(() => fmsStore.accountSet?.id, async () => {
  const accountSetId = fmsStore.accountSet?.id
  voucherWords.value = accountSetId ? await getVoucherWordSimpleList(accountSetId) : []
}, { immediate: true })
</script>
