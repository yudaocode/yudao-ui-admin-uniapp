<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
  <view v-if="loaded && options.length === 0 && emptyText" class="mt-16rpx text-24rpx text-[#999]">
    {{ emptyText }}
  </view>
</template>

<script lang="ts" setup>
import type { CalTeam } from '@/api/mes/cal/team'
import { onMounted, ref } from 'vue'
import { getTeamList } from '@/api/mes/cal/team'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  emptyText?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '班组',
  labelWidth: '220rpx',
  placeholder: '请选择班组',
  emptyText: '',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: CalTeam | undefined]
}>()

const options = ref<CalTeam[]>([]) // 班组选项
const loaded = ref(false) // 是否已加载班组
let loadingPromise: Promise<CalTeam[]> | undefined

/** 加载班组选项 */
function loadOptions() {
  if (loaded.value) {
    return Promise.resolve(options.value)
  }
  if (!loadingPromise) {
    loadingPromise = getTeamList().then((list) => {
      options.value = list.filter(item => item.id != null)
      loaded.value = true
      return options.value
    }).finally(() => {
      loadingPromise = undefined
    })
  }
  return loadingPromise
}

/** 获取首个班组编号 */
async function getFirstId() {
  const teams = await loadOptions()
  return teams[0]?.id
}

/** 更新班组编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择班组 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空班组 */
function handleClear() {
  emit('change', undefined)
}

defineExpose({ getFirstId })

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
