<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { RecruitChannel } from '@/api/hrm/recruit/channel'
import { computed, onMounted, ref, watch } from 'vue'
import { getRecruitChannel, getRecruitChannelSimpleList } from '@/api/hrm/recruit/channel'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
  excludeIds?: number[]
}>(), {
  label: '招聘渠道',
  labelWidth: '180rpx',
  placeholder: '请选择招聘渠道',
  prop: '',
  disabled: false,
  clearable: true,
  excludeIds: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: RecruitChannel | undefined]
}>()

const channelList = ref<RecruitChannel[]>([]) // 可选项
const selectedChannel = ref<RecruitChannel>() // 已停用当前值回显

const options = computed(() => { // 排除指定渠道，并补回当前停用值
  const list = channelList.value.filter(
    item => item.id != null && !props.excludeIds.includes(item.id),
  )
  const current = selectedChannel.value
  if (
    current?.id == null
    || props.excludeIds.includes(current.id)
    || list.some(item => item.id === current.id)
  ) {
    return list
  }
  return [current, ...list]
})

/** 加载招聘渠道选项 */
async function loadOptions() {
  channelList.value = await getRecruitChannelSimpleList()
  await ensureSelectedChannel()
}

/** 补充当前选中的停用渠道，支持回显 */
async function ensureSelectedChannel() {
  const channelId = props.modelValue
  selectedChannel.value = undefined
  if (channelId == null || channelList.value.some(item => item.id === channelId)) {
    return
  }
  const channel = await getRecruitChannel(channelId)
  if (props.modelValue === channelId && channel?.id === channelId) {
    selectedChannel.value = channel
  }
}

/** 更新渠道编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择渠道 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空渠道 */
function handleClear() {
  emit('change', undefined)
}

watch(() => props.modelValue, () => {
  ensureSelectedChannel()
})

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
