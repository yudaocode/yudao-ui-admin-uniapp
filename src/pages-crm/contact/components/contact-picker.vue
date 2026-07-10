<template>
  <view @click="handleOpen">
    <slot />
  </view>

  <wd-select-picker
    ref="pickerRef"
    v-model="selectedId"
    :title="title"
    :columns="pickerOptions"
    value-key="id"
    label-key="name"
    type="radio"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { Contact } from '@/api/crm/contact'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleContactList } from '@/api/crm/contact'

const props = withDefaults(defineProps<{
  modelValue?: number
  customerId?: number
  title?: string
  disabled?: boolean
}>(), {
  title: '选择联系人',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'confirm': [item: Contact | undefined]
}>()

const options = ref<Contact[]>([]) // 联系人选项
const selectedId = ref<number | string>(props.modelValue ?? '') // 当前联系人编号
const pickerRef = ref<SelectPickerInstance>() // 联系人选择器
const pickerOptions = computed(() => { // 当前客户下的联系人
  return props.customerId
    ? options.value.filter(item => item.customerId === props.customerId)
    : options.value
})

/** 加载联系人选项 */
async function loadOptions() {
  options.value = (await getSimpleContactList()).filter(item => item.id != null)
}

/** 打开选择器 */
function handleOpen() {
  if (!props.disabled) {
    pickerRef.value?.open()
  }
}

/** 确认联系人 */
function handleConfirm({ value }: { value: any }) {
  const item = pickerOptions.value.find(option => `${option.id}` === `${value}`)
  emit('update:modelValue', item?.id)
  emit('confirm', item)
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  value => selectedId.value = value ?? '',
  { immediate: true },
)

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
