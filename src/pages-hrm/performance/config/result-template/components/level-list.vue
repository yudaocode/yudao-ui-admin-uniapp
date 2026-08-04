<template>
  <view>
    <view class="mb-16rpx flex items-center justify-between px-24rpx">
      <view>
        <text class="text-30rpx text-[#333] font-semibold">结果等级</text>
        <text class="ml-16rpx text-24rpx text-[#999]">
          {{ levels.length ? `${levels.length} 个` : '--' }}
        </text>
      </view>
      <wd-button
        v-if="!disabled"
        size="small"
        type="primary"
        @click="openLevelForm()"
      >
        新增结果等级
      </wd-button>
    </view>

    <view class="mx-24rpx mb-16rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-20rpx text-24rpx text-[#1677ff]">
      分数区间须从 0 到 100 连续且不重叠；绩效系数不小于 0，分数和系数最多保留两位小数。
    </view>

    <view
      v-if="!levels.length"
      class="mx-24rpx rounded-12rpx bg-white py-60rpx text-center text-28rpx text-[#999] shadow-sm"
    >
      暂无结果等级
    </view>

    <view
      v-for="(level, index) in levels"
      :key="index"
      class="mx-24rpx mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
    >
      <view class="flex items-start justify-between gap-16rpx px-24rpx py-20rpx">
        <view class="min-w-0 flex-1">
          <view class="mb-8rpx text-30rpx text-[#333] font-semibold">
            {{ level.name || '-' }}
          </view>
          <view class="text-24rpx text-[#666]">
            分数 {{ level.minScore }} ~ {{ level.maxScore }}
          </view>
          <view class="mt-8rpx text-24rpx text-[#666]">
            绩效系数 {{ level.coefficient }}
          </view>
        </view>
        <view v-if="!disabled" class="flex shrink-0 gap-8rpx">
          <wd-button size="small" type="primary" variant="text" @click="openLevelForm(index)">
            编辑
          </wd-button>
          <wd-button size="small" type="danger" variant="text" @click="removeLevel(index)">
            删除
          </wd-button>
        </view>
      </view>
    </view>

    <LevelForm ref="levelFormRef" @confirm="handleLevelConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { ResultLevel } from '@/api/hrm/performance/config/result-template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { validateResultLevels } from '@/pages-hrm/utils/performance'
import LevelForm from './level-form.vue'

const props = withDefaults(defineProps<{
  modelValue: ResultLevel[]
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: ResultLevel[]]
}>()

const toast = useToast()
const levelFormRef = ref<InstanceType<typeof LevelForm>>() // 等级表单
const editingIndex = ref<number>() // 编辑中的等级下标
const levels = computed(() => props.modelValue || [])

/** 打开等级表单 */
function openLevelForm(index?: number) {
  editingIndex.value = index
  levelFormRef.value?.open(index === undefined ? undefined : levels.value[index])
}

/** 确认等级 */
function handleLevelConfirm(level: ResultLevel) {
  const next = [...levels.value]
  if (editingIndex.value === undefined) {
    next.push(level)
  } else {
    next[editingIndex.value] = level
  }
  emit('update:modelValue', next)
}

/** 删除等级 */
function removeLevel(index: number) {
  emit(
    'update:modelValue',
    levels.value.filter((_, levelIndex) => levelIndex !== index),
  )
}

/** 校验结果等级 */
function validate() {
  const message = validateResultLevels(levels.value)
  if (message) {
    toast.warning(message)
    return false
  }
  return true
}
defineExpose({ validate })
</script>
