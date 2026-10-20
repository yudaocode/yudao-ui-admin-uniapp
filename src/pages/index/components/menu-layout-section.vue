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
      <template v-for="sub in group.subGroups" :key="sub.key">
        <!-- 二级分组小标题（name 为空则不展示，直接平铺） -->
        <view v-if="sub.name" class="flex items-center px-24rpx pb-8rpx pt-28rpx">
          <view class="mr-12rpx h-22rpx w-6rpx rounded-4rpx bg-#3370ff" />
          <text class="text-24rpx text-#666">{{ sub.name }}</text>
        </view>
        <MenuGrid :menus="sub.menus" />
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
  name: 'MenuLayoutSection',
})

defineProps<{
  groups: MenuGroup[] // 菜单分组列表
  favorites: MenuItem[] // 常用菜单列表
  recents: MenuItem[] // 最近使用菜单列表
}>()
</script>
