<template>
  <view class="min-h-screen bg-#f5f5f5">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="编辑工作台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索框 -->
    <view>
      <wd-search v-model="searchKeyword" placeholder="搜索" hide-cancel />
    </view>

    <!-- 常用区域 -->
    <view class="mx-20rpx mt-20rpx overflow-hidden rounded-16rpx bg-white">
      <view class="section-header">
        <text class="text-28rpx text-#333 font-500">常用</text>
      </view>
      <!-- 常用分组 -->
      <view v-if="favoriteMenus.length > 0" class="menu-list">
        <view v-for="menu in favoriteMenus" :key="menu.key" class="menu-item">
          <view class="menu-item__left">
            <view class="menu-item__icon" :style="{ backgroundColor: menu.iconColor ? `${menu.iconColor}20` : '#f5f5f5' }">
              <wd-icon :name="menu.icon" size="40rpx" :color="menu.iconColor" />
            </view>
            <text class="menu-item__name">{{ menu.name }}</text>
          </view>
          <view class="menu-item__right">
            <wd-button size="small" type="warning" plain custom-class="mr-16rpx" @click="handleRemoveFavorite(menu)">
              从常用移除
            </wd-button>
            <wd-icon name="menu" size="40rpx" color="#ccc" />
          </view>
        </view>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-60rpx">
        <wd-button type="primary" plain @click="scrollToGroups">
          <wd-icon name="add" size="28rpx" />
          添加我常用的
        </wd-button>
      </view>
    </view>

    <!-- 菜单分组 -->
    <view id="menuGroups">
      <view v-for="group in filteredMenuGroups" :key="group.key" class="mx-20rpx mt-20rpx overflow-hidden rounded-16rpx bg-white">
        <view class="section-header">
          <text class="text-28rpx text-#333 font-500">{{ group.name }}</text>
        </view>
        <view class="menu-list">
          <view v-for="menu in group.menus" :key="menu.key" class="menu-item">
            <view class="menu-item__left">
              <view class="menu-item__icon" :style="{ backgroundColor: menu.iconColor ? `${menu.iconColor}20` : '#f5f5f5' }">
                <wd-icon :name="menu.icon" size="40rpx" :color="menu.iconColor" />
              </view>
              <text class="menu-item__name">{{ menu.name }}</text>
            </view>
            <view class="menu-item__right">
              <wd-button v-if="isInFavorites(menu)" size="small" type="warning" plain @click="handleRemoveFavorite(menu)">
                从常用移除
              </wd-button>
              <wd-button v-else size="small" type="primary" plain @click="handleAddFavorite(menu)">
                添加至常用
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部安全区域 -->
    <view class="h-40rpx" />
  </view>
</template>

<script lang="ts" setup>
import type { MenuGroup, MenuItem } from '../index'
import { useUserStore } from '@/store/user'
import { getMenuGroups, getMenuItemByKey } from '../index'
import { navigateBackPlus } from '@/utils';

defineOptions({
  name: 'FavoriteSettings',
})

definePage({
  style: {
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()

const searchKeyword = ref('') // 搜索关键词
const menuGroups = ref<MenuGroup[]>([]) // 菜单分组列表
const favoriteMenus = computed<MenuItem[]>(() => {
  const keys = userStore.favoriteMenus
  if (!keys || keys.length === 0) {
    return []
  }
  return keys.map(key => getMenuItemByKey(key)).filter(Boolean) as MenuItem[]
}) // 常用服务菜单（从 store 中计算得出）

/** 过滤后的菜单分组 */
const filteredMenuGroups = computed(() => {
  if (!searchKeyword.value) {
    return menuGroups.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return menuGroups.value
    .map(group => ({
      ...group,
      menus: group.menus.filter(menu => menu.name.toLowerCase().includes(keyword)),
    }))
    .filter(group => group.menus.length > 0)
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 初始化数据 */
function initData() {
  menuGroups.value = getMenuGroups()
}

/** 处理添加常用服务 */
function handleAddFavorite(menu: MenuItem) {
  const keys = [...userStore.favoriteMenus]
  if (!keys.includes(menu.key)) {
    keys.push(menu.key)
    userStore.setFavoriteMenus(keys)
  }
  uni.showToast({ title: '已添加', icon: 'success' })
}

/** 处理移除常用服务 */
function handleRemoveFavorite(menu: MenuItem) {
  const keys = [...userStore.favoriteMenus]
  const index = keys.indexOf(menu.key)
  if (index > -1) {
    keys.splice(index, 1)
    userStore.setFavoriteMenus(keys)
  }
  uni.showToast({ title: '已移除', icon: 'success' })
}

/** 检查菜单是否已添加到常用服务 */
function isInFavorites(menu: MenuItem): boolean {
  return favoriteMenus.value.some(m => m.key === menu.key)
}

/** 滚动到菜单分组区域 */
function scrollToGroups() {
  uni.pageScrollTo({
    selector: '#menuGroups',
    duration: 300,
  })
}

onLoad(() => {
  initData()
})
</script>

<style lang="scss" scoped>
.section-header {
  padding: 24rpx 30rpx 16rpx;
}

.menu-list {
  padding: 0 30rpx 20rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  &__left {
    display: flex;
    align-items: center;
  }

  &__icon {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    margin-right: 24rpx;
  }

  &__name {
    font-size: 30rpx;
    color: #333;
  }

  &__right {
    display: flex;
    align-items: center;
  }
}
</style>
