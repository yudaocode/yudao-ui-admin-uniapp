<template>
  <yd-form-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :columns="options"
    label-key="nickname"
    value-key="id"
    :placeholder="placeholder"
    :before-open="ensureOptions"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { MpUser } from '@/api/mp/user'
import type { YdFormPickerExpose } from '@/components/yudao-ui'
import { ref, watch } from 'vue'
import { getUserPage } from '@/api/mp/user'

const props = withDefaults(defineProps<{
  modelValue?: number
  accountId?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '用户',
  labelWidth: '220rpx',
  placeholder: '请选择用户',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [user: MpUser | undefined]
}>()

const pickerRef = ref<YdFormPickerExpose>() // 通用表单选择器
const options = ref<MpUser[]>([]) // 公众号用户选项
let loadedAccountId: number | undefined // 已加载的公众号账号
let loadingAccountId: number | undefined // 正在加载的公众号账号
let loadingPromise: Promise<void> | undefined // 用户选项加载请求

/** 加载公众号用户选项 */
async function loadOptions() {
  const accountId = props.accountId ? Number(props.accountId) : undefined
  if (!accountId || loadedAccountId === accountId) {
    return
  }
  if (!loadingPromise || loadingAccountId !== accountId) {
    const promise = getUserPage({ pageNo: 1, pageSize: 50, accountId })
      .then((data) => {
        if (Number(props.accountId) !== accountId) {
          return
        }
        options.value = data.list.map(item => ({ ...item, nickname: item.nickname || item.openid }))
        loadedAccountId = accountId
      })
      .finally(() => {
        if (loadingPromise === promise) {
          loadingAccountId = undefined
          loadingPromise = undefined
        }
      })
    loadingAccountId = accountId
    loadingPromise = promise
  }
  try {
    await loadingPromise
  } catch {
    options.value = []
  }
}

/** 打开前确保用户选项 */
function ensureOptions() {
  if (!props.accountId) {
    return false
  }
  loadOptions()
}

/** 更新用户编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择用户 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化用户编号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

watch(
  () => props.accountId,
  () => {
    options.value = []
    loadedAccountId = undefined
    loadOptions()
  },
  { immediate: true },
)
</script>
