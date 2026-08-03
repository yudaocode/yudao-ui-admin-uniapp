<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="pickerLabel"
    value-key="id"
    :placeholder="placeholder"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { RecruitPost } from '@/api/hrm/recruit/post'
import { computed, onMounted, ref, watch } from 'vue'
import { getRecruitPost, getRecruitPostSimpleList } from '@/api/hrm/recruit/post'

interface RecruitPostOption extends RecruitPost {
  pickerLabel: string
}

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '应聘职位',
  labelWidth: '180rpx',
  placeholder: '请选择应聘职位',
  prop: '',
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: RecruitPost | undefined]
}>()

const postList = ref<RecruitPost[]>([]) // 可选项
const selectedPost = ref<RecruitPost>() // 已停招当前值回显

/** 职位展示文案 */
function buildPickerLabel(item: RecruitPost) {
  return item.deptName ? `${item.postName}（${item.deptName}）` : item.postName
}

const options = computed<RecruitPostOption[]>(() => { // 补回当前停招值
  const list = postList.value.filter(item => item.id != null)
  const current = selectedPost.value
  const rows = current?.id != null && !list.some(item => item.id === current.id)
    ? [current, ...list]
    : list
  return rows.map(item => ({
    ...item,
    pickerLabel: buildPickerLabel(item),
  }))
})

/** 加载招聘职位选项 */
async function loadOptions() {
  postList.value = await getRecruitPostSimpleList()
  await ensureSelectedPost()
}

/** 补充当前选中的停招职位，支持回显 */
async function ensureSelectedPost() {
  const postId = props.modelValue
  selectedPost.value = undefined
  if (postId == null || postList.value.some(item => item.id === postId)) {
    return
  }
  const post = await getRecruitPost(postId)
  if (props.modelValue === postId && post?.id === postId) {
    selectedPost.value = post
  }
}

/** 更新职位编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择职位 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空职位 */
function handleClear() {
  emit('change', undefined)
}

watch(() => props.modelValue, () => {
  ensureSelectedPost()
})

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
