<template>
  <!-- wd-form-item 不接收 disabled prop：禁用态降低不透明度并取消 is-link，只读展示 -->
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :is-link="!disabled"
    :value="selectedLabel"
    :placeholder="placeholder"
    :class="disabled ? 'opacity-50' : ''"
    @click="handleOpen"
  />

  <SubjectPicker
    ref="pickerRef"
    :account-set-id="accountSetId"
    :subjects="subjects"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Subject } from '@/api/fms/config/subject'
import { getSubjectSimpleList } from '@/api/fms/config/subject'
import SubjectPicker from './subject-picker.vue'

const props = withDefaults(defineProps<{
  accountSetId?: number
  disabled?: boolean
  label?: string
  labelWidth?: string
  modelValue?: number
  placeholder?: string
  prop?: string
  subjects?: Subject[] // 外部已加载的平铺科目列表，用于回显与下钻，避免重复请求
}>(), {
  disabled: false,
  label: '会计科目',
  labelWidth: '220rpx',
  placeholder: '请选择会计科目',
  prop: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'confirm': [subject: Subject | undefined]
  'change': [subject: Subject | undefined]
}>()

const loadedSubjects = ref<Subject[]>([]) // 自行加载的科目列表（未传入 subjects 时用于回显）
const pickerRef = ref<InstanceType<typeof SubjectPicker>>() // 科目选择器
const subjectList = computed(() => props.subjects || loadedSubjects.value) // 科目列表
const selectedLabel = computed(() => {
  const subject = subjectList.value.find(item => item.id === props.modelValue)
  return subject ? `${subject.code} ${subject.name}` : ''
}) // 选中文案

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open()
}

/** 选择确认 */
function handleConfirm(subject: Subject) {
  emit('update:modelValue', subject.id)
  emit('confirm', subject)
  emit('change', subject)
}

/** 加载科目列表 */
async function loadSubjects() {
  if (props.subjects || !props.accountSetId) {
    return
  }
  loadedSubjects.value = await getSubjectSimpleList(props.accountSetId)
}

watch(
  () => [props.accountSetId, props.subjects],
  () => {
    loadSubjects()
  },
)

/** 初始化 */
onMounted(() => {
  loadSubjects()
})
</script>
