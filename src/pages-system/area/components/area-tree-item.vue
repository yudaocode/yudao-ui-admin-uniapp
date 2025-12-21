<template>
  <view class="mb-16rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view
      class="flex items-center justify-between p-24rpx"
      @click="handleToggle"
    >
      <view class="flex items-center">
        <!-- 展开/收起图标 -->
        <view class="mr-16rpx w-40rpx">
          <wd-icon
            v-if="hasChildren"
            :name="expanded ? 'arrow-down' : 'arrow-right'"
            size="16px"
            color="#999"
          />
        </view>
        <!-- 地区信息 -->
        <view class="text-28rpx text-[#333]">
          {{ item.name }}
        </view>
      </view>
      <!-- 编码 -->
      <view class="text-24rpx text-[#999]">
        编码：{{ item.id }}
      </view>
    </view>

    <!-- 子节点 -->
    <view v-if="expanded && hasChildren" class="border-t border-[#f5f5f5] pl-56rpx">
      <AreaTreeItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :level="level + 1"
      />
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Area } from '@/api/system/area'
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  item: Area
  level?: number
}>(), {
  level: 0,
})

const expanded = ref(false)
const hasChildren = computed(() => props.item.children && props.item.children.length > 0)

/** 切换展开/收起 */
function handleToggle() {
  if (hasChildren.value) {
    expanded.value = !expanded.value
  }
}
</script>

<style lang="scss" scoped>
</style>
