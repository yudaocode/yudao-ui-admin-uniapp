<template>
  <wd-radio-group
    :model-value="modelValue"
    type="button"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <wd-radio v-for="item in voucherWords" :key="item.id" :value="item.id">
      {{ item.name }}
    </wd-radio>
  </wd-radio-group>
</template>

<script lang="ts" setup>
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import { getVoucherWordSimpleList } from '@/api/fms/config/voucher-word'
import { useFmsStore } from '@/pages-fms/store/fms'

const props = defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const fmsStore = useFmsStore()
const voucherWords = ref<VoucherWord[]>([]) // 凭证字选项来源

/** 账套变化时刷新凭证字选项 */
watch(() => fmsStore.accountSet?.id, async () => {
  const accountSetId = fmsStore.accountSet?.id
  voucherWords.value = accountSetId ? await getVoucherWordSimpleList(accountSetId) : []
}, { immediate: true })

/** 值为空时自动选中默认凭证字（无默认取第一条） */
watch([voucherWords, () => props.modelValue], ([list, value]) => {
  if ((value === undefined || value === 0) && list.length > 0) {
    emit('update:modelValue', list.find(item => item.defaultStatus)?.id ?? list[0].id)
  }
})
</script>
