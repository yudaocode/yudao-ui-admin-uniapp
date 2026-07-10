<!-- 公众号粉丝标签选择：自拉标签列表 + 多选回填 -->
<template>
  <view>
    <wd-form-item
      :title="label"
      :title-width="titleWidth"
      is-link
      :value="selectedLabel"
      :placeholder="placeholder"
      @click="handleOpen"
    />
    <wd-select-picker
      ref="pickerRef"
      :model-value="modelValue || []"
      :title="placeholder"
      :columns="tagList"
      value-key="tagId"
      label-key="name"
      type="checkbox"
      filterable
      @update:model-value="handleChange"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { Tag } from '@/api/mp/tag'
import { computed, onMounted, ref } from 'vue'
import { getSimpleTagList } from '@/api/mp/tag'

const props = withDefaults(defineProps<{
  modelValue?: number[] // 选中的标签编号
  label?: string // 字段标题
  titleWidth?: string // 标题宽度
  placeholder?: string // 未选择占位
}>(), {
  label: '标签',
  titleWidth: '220rpx',
  placeholder: '请选择标签',
})

const emit = defineEmits<{ (e: 'update:modelValue', value: number[]): void }>()

const pickerRef = ref<SelectPickerInstance>() // 标签选择器
const tagList = ref<Tag[]>([]) // 标签列表

/** 选中标签名拼接展示 */
const selectedLabel = computed(() =>
  (props.modelValue || [])
    .map(id => tagList.value.find(tag => tag.tagId === id)?.name)
    .filter(Boolean)
    .join('、'),
)

/** 选择变化：归一为数字编号回传 */
function handleChange(value: Array<boolean | number | string>) {
  emit('update:modelValue', value.map(Number))
}

/** 打开标签选择器 */
function handleOpen() {
  pickerRef.value?.open()
}

/** 加载标签列表（失败时保留已选编号） */
onMounted(async () => {
  try {
    tagList.value = await getSimpleTagList()
  } catch {
    tagList.value = []
  }
})
</script>
