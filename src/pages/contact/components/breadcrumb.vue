<template>
  <view v-if="breadcrumbList.length > 0" class="bg-white px-24rpx py-16rpx">
    <scroll-view scroll-x class="whitespace-nowrap">
      <view class="inline-flex items-center">
        <view
          class="flex items-center text-28rpx"
          :class="breadcrumbList.length > 0 ? 'text-[#1890ff]' : 'text-[#333]'"
          @click="handleClick(-1)"
        >
          <text>全部</text>
        </view>
        <template v-for="(item, index) in breadcrumbList" :key="item.id">
          <wd-icon name="arrow-right" size="12px" color="#999" custom-class="mx-8rpx" />
          <view
            class="flex items-center text-28rpx"
            :class="index < breadcrumbList.length - 1 ? 'text-[#1890ff]' : 'text-[#333]'"
            @click="handleClick(index)"
          >
            <text>{{ item.name }}</text>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

interface BreadcrumbItem {
  id: number
  name: string
}

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const breadcrumbList = ref<BreadcrumbItem[]>([])

/** 监听外部值变化 */
watch(() => props.modelValue, (val) => {
  if (val === 0) {
    breadcrumbList.value = []
  }
})

/** 点击面包屑 */
function handleClick(index: number) {
  if (index === -1) {
    // 点击"全部"
    breadcrumbList.value = []
    emit('update:modelValue', 0)
  } else if (index < breadcrumbList.value.length - 1) {
    // 点击中间层级
    const item = breadcrumbList.value[index]
    breadcrumbList.value = breadcrumbList.value.slice(0, index + 1)
    emit('update:modelValue', item.id)
  }
}

/** 进入子层级 */
function enter(item: BreadcrumbItem) {
  breadcrumbList.value.push(item)
  emit('update:modelValue', item.id)
}

/** 返回上一层级 */
function back(): boolean {
  if (breadcrumbList.value.length === 0) {
    return false
  }
  breadcrumbList.value.pop()
  const lastItem = breadcrumbList.value[breadcrumbList.value.length - 1]
  emit('update:modelValue', lastItem?.id ?? 0)
  return true
}

defineExpose({ enter, back })
</script>
