<template>
  <view class="h-full min-h-0 flex flex-1 flex-col overflow-hidden bg-white">
    <!-- 顶部横向 Tab -->
    <scroll-view
      class="flex-shrink-0 border-b-1rpx border-#f0f0f0"
      scroll-x
      :scroll-into-view="tabAnchor"
      :show-scrollbar="false"
      scroll-with-animation
    >
      <view class="inline-flex">
        <view
          :id="`tab-${FAVORITE_TAB_KEY}`"
          class="flex flex-shrink-0 flex-col items-center px-26rpx py-18rpx"
          @click="active = FAVORITE_TAB_KEY"
        >
          <text class="text-28rpx" :class="active === FAVORITE_TAB_KEY ? 'text-#3370ff font-500' : 'text-#666'">我的常用</text>
          <view class="mt-10rpx h-6rpx w-32rpx rounded-3rpx" :class="active === FAVORITE_TAB_KEY ? 'bg-#3370ff' : 'bg-transparent'" />
        </view>
        <view
          v-for="group in groups"
          :id="`tab-${group.key}`"
          :key="group.key"
          class="flex flex-shrink-0 flex-col items-center px-26rpx py-18rpx"
          @click="active = group.key"
        >
          <text class="text-28rpx" :class="isActiveGroup(group) ? 'text-#3370ff font-500' : 'text-#666'">{{ group.name }}</text>
          <view class="mt-10rpx h-6rpx w-32rpx rounded-3rpx" :class="isActiveGroup(group) ? 'bg-#3370ff' : 'bg-transparent'" />
        </view>
      </view>
    </scroll-view>

    <!-- 内容区 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation :scroll-into-view="topAnchor">
      <view id="pane-top" />
      <!-- 我的常用 + 最近使用 -->
      <template v-if="active === FAVORITE_TAB_KEY">
        <MenuFavorite :menus="favorites" />
        <MenuRecent :menus="recents" />
      </template>
      <!-- 模块二级分组 -->
      <template v-else-if="activeGroup">
        <view class="px-24rpx pb-4rpx pt-24rpx">
          <text class="text-28rpx text-#333 font-500">{{ activeGroup.name }}</text>
        </view>
        <template v-for="sub in activeGroup.subGroups" :key="sub.key">
          <view v-if="sub.name" class="flex items-center px-24rpx pb-8rpx pt-28rpx">
            <view class="mr-12rpx h-22rpx w-6rpx rounded-4rpx bg-#3370ff" />
            <text class="text-24rpx text-#666">{{ sub.name }}</text>
          </view>
          <MenuGrid :menus="sub.menus" />
        </template>
      </template>

      <!-- 底部安全区域 -->
      <view class="h-40rpx" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { MenuGroup, MenuItem } from '../index'
import { FAVORITE_TAB_KEY } from '../index'
import MenuFavorite from './menu-favorite.vue'
import MenuGrid from './menu-grid.vue'
import MenuRecent from './menu-recent.vue'

defineOptions({
  name: 'MenuLayoutTabs',
})

const props = defineProps<{
  groups: MenuGroup[] // 菜单分组列表
  favorites: MenuItem[] // 常用菜单列表
  recents: MenuItem[] // 最近使用菜单列表
}>()

// 有常用/最近时默认进入快捷区，否则首个分组
const hasQuickMenus = props.favorites.length > 0 || props.recents.length > 0
const active = ref<string>(hasQuickMenus ? FAVORITE_TAB_KEY : '')

/** 当前选中的分组（active 为空时回退到首个分组） */
const activeGroup = computed<MenuGroup | null>(() => {
  if (active.value === FAVORITE_TAB_KEY) {
    return null
  }
  return props.groups.find(group => group.key === active.value) || props.groups[0] || null
})

/** 判断分组是否选中（兼容 active 为空时的首个分组高亮） */
function isActiveGroup(group: MenuGroup): boolean {
  if (active.value === FAVORITE_TAB_KEY) {
    return false
  }
  if (active.value === '') {
    return props.groups[0]?.key === group.key
  }
  return active.value === group.key
}

const tabAnchor = ref('') // 当前激活 Tab 的横向滚动锚点；初始空以便首屏能看到「我的常用」
const topAnchor = ref('') // 切换 Tab 时内容区回顶的锚点
watch(() => active.value, () => {
  topAnchor.value = ''
  nextTick(() => {
    topAnchor.value = 'pane-top'
  })
  tabAnchor.value = `tab-${active.value || props.groups[0]?.key || ''}`
})
</script>
