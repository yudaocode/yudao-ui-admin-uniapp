<template>
  <scroll-view class="h-full min-h-0 flex-1" scroll-y scroll-with-animation>
    <!-- 常用 -->
    <MenuFavorite :menus="favorites" />
    <!-- 最近使用 -->
    <MenuRecent :menus="recents" />

    <!-- 菜单分组 -->
    <view v-for="group in groups" :key="group.key" class="mx-20rpx mt-20rpx overflow-hidden rounded-16rpx bg-white">
      <view class="px-24rpx pb-0 pt-20rpx">
        <text class="text-28rpx text-#333 font-500">{{ group.name }}</text>
      </view>

      <!-- 仅一个无名二级分组：直接平铺，不做折叠 -->
      <MenuGrid v-if="isSimple(group)" :menus="group.subGroups[0].menus" />

      <!-- 多个二级分组：逐个折叠 -->
      <template v-else>
        <view v-for="(sub, idx) in group.subGroups" :key="sub.key">
          <view
            class="flex items-center border-t-1rpx border-#f5f5f5 px-24rpx py-22rpx"
            @click="toggle(group.key, sub.key, idx)"
          >
            <wd-icon :name="isOpen(group.key, sub.key, idx) ? 'down' : 'right'" size="26rpx" color="#999" />
            <text class="ml-12rpx text-26rpx text-#333 font-500">{{ sub.name || group.name }}</text>
            <view class="flex-1" />
            <text class="rounded-full bg-#f2f3f5 px-16rpx py-3rpx text-22rpx text-#999">{{ sub.menus.length }}</text>
          </view>
          <MenuGrid v-if="isOpen(group.key, sub.key, idx)" :menus="sub.menus" />
        </view>
      </template>
    </view>

    <!-- 底部安全区域 -->
    <view class="h-40rpx" />
  </scroll-view>
</template>

<script lang="ts" setup>
import type { MenuGroup, MenuItem } from '../index'
import MenuFavorite from './menu-favorite.vue'
import MenuGrid from './menu-grid.vue'
import MenuRecent from './menu-recent.vue'

defineOptions({
  name: 'MenuLayoutAccordion',
})

defineProps<{
  groups: MenuGroup[] // 菜单分组列表
  favorites: MenuItem[] // 常用菜单列表
  recents: MenuItem[] // 最近使用菜单列表
}>()

const openKeys = ref<Record<string, boolean>>({}) // 折叠展开状态

/** 是否仅含一个无名二级分组（直接平铺，无需折叠） */
function isSimple(group: MenuGroup): boolean {
  return group.subGroups.length === 1 && !group.subGroups[0].name
}

/** 某二级分组是否展开（无显式状态时，每组第一个默认展开） */
function isOpen(groupKey: string, subKey: string, index: number): boolean {
  const value = openKeys.value[`${groupKey}/${subKey}`]
  return value ?? index === 0
}

/** 切换某二级分组的展开状态 */
function toggle(groupKey: string, subKey: string, index: number) {
  const fullKey = `${groupKey}/${subKey}`
  openKeys.value = { ...openKeys.value, [fullKey]: !isOpen(groupKey, subKey, index) }
}
</script>
