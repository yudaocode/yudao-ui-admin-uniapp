<template>
  <view class="bg-white px-24rpx py-16rpx">
    <scroll-view scroll-x class="whitespace-nowrap">
      <view class="inline-flex items-center text-28rpx">
        <template v-for="(item, index) in breadcrumbItems" :key="item.id">
          <text v-if="index > 0" class="mx-8rpx text-[#999]">/</text>
          <text
            :class="index === breadcrumbItems.length - 1 ? 'text-[#333]' : 'text-[#1890ff]'"
            @click="handleClick(index)"
          >
            {{ item.name }}
          </text>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

export interface BreadcrumbNode {
  id: number
  name: string
  [key: string]: any
}

const props = withDefaults(defineProps<{
  modelValue?: number // 当前父节点编号
  rootName?: string // 根目录名称
}>(), {
  modelValue: 0,
  rootName: '根目录',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  back: [] // 返回上一层级事件
}>()

const breadcrumbs = ref<BreadcrumbNode[]>([]) // 面包屑路径（不包含根目录）

const breadcrumbItems = computed(() => [
  { id: 0, name: props.rootName },
  ...breadcrumbs.value,
]) // 面包屑显示数据（包含根目录）

const currentParentId = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
}) // 当前父节点编号

/** 面包屑点击 */
function handleClick(index: number) {
  if (index === breadcrumbItems.value.length - 1) return // 点击当前层级不处理
  if (index === 0) {
    breadcrumbs.value = []
    currentParentId.value = 0
  } else {
    breadcrumbs.value = breadcrumbs.value.slice(0, index)
    currentParentId.value = breadcrumbs.value[index - 1].id
  }
}

/** 进入子层级 */
function enter(node: BreadcrumbNode) {
  breadcrumbs.value.push({ id: node.id, name: node.name })
  currentParentId.value = node.id
}

/** 返回上一层级，返回 true 表示还有上层，false 表示已在根目录 */
function back(): boolean {
  if (breadcrumbs.value.length > 0) {
    breadcrumbs.value.pop()
    currentParentId.value = breadcrumbs.value.length > 0
      ? breadcrumbs.value[breadcrumbs.value.length - 1].id
      : 0
    return true
  }
  return false
}

/** 监听外部 modelValue 变化，重置面包屑（用于外部重置场景） */
watch(() => props.modelValue, (val) => {
  if (val === 0 && breadcrumbs.value.length > 0) {
    breadcrumbs.value = []
  }
})

defineExpose({
  enter,
  back,
  breadcrumbs,
})
</script>

<style lang="scss" scoped>
</style>
