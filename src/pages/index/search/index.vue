<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="搜索菜单"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索框 -->
    <view class="bg-white px-20rpx py-12rpx">
      <wd-search v-model="keyword" placeholder="搜索菜单名称" hide-cancel focus />
    </view>

    <!-- 结果区 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 未输入关键词 -->
      <view v-if="!trimmedKeyword" class="flex flex-col items-center justify-center py-160rpx">
        <wd-icon name="search-line" size="80rpx" color="#dcdcdc" />
        <text class="mt-20rpx text-26rpx text-#999">输入菜单名称，快速跳转</text>
      </view>
      <!-- 有关键词但无结果 -->
      <view v-else-if="results.length === 0" class="flex flex-col items-center justify-center py-160rpx">
        <wd-icon name="info-circle" size="80rpx" color="#dcdcdc" />
        <text class="mt-20rpx text-26rpx text-#999">没有找到「{{ trimmedKeyword }}」相关菜单</text>
      </view>
      <!-- 结果列表 -->
      <view v-else class="bg-white">
        <view
          v-for="menu in results"
          :key="menu.key"
          class="flex items-center border-b-1rpx border-#f5f5f5 px-24rpx py-22rpx"
          @click="navigateToMenu(menu)"
        >
          <view
            class="mr-20rpx h-72rpx w-72rpx flex flex-shrink-0 items-center justify-center rounded-14rpx"
            :style="{ backgroundColor: menu.iconColor ? `${menu.iconColor}20` : '#f5f5f5' }"
          >
            <wd-icon :name="menu.icon" size="40rpx" :color="menu.iconColor" />
          </view>
          <view class="min-w-0 flex-1">
            <text class="block text-28rpx text-#333">{{ menu.name }}</text>
            <text class="mt-4rpx block text-22rpx text-#999">{{ groupLabel(menu) }}</text>
          </view>
          <wd-icon name="right" size="28rpx" color="#ccc" />
        </view>
      </view>
      <view class="h-40rpx" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { SearchableMenuItem } from '../index'
import { navigateBackPlus } from '@/utils'
import { getSearchableMenus, useMenuNavigate } from '../index'

defineOptions({
  name: 'MenuSearch',
})

definePage({
  style: {
    navigationStyle: 'custom',
  },
})

const { navigateToMenu } = useMenuNavigate()

const keyword = ref('') // 搜索关键词
const allMenus = ref<SearchableMenuItem[]>([]) // 全部可搜索菜单

/** 去除首尾空格的关键词 */
const trimmedKeyword = computed(() => keyword.value.trim())

/** 子序列模糊匹配：sub 的字符按顺序出现在 str 中即可（如「订理」匹配「订单管理」） */
function isSubsequence(str: string, sub: string): boolean {
  if (!sub) {
    return true
  }
  let i = 0
  for (const ch of str) {
    if (ch === sub[i]) {
      i += 1
      if (i === sub.length) {
        return true
      }
    }
  }
  return false
}

/**
 * 计算菜单与各关键词的匹配分（-1 = 不匹配）
 *
 * 匹配范围：菜单名 + 模块名 + 二级分组 + 英文 key；多关键词需全部命中（AND）。
 * 打分用于排序：名称开头 > 名称包含 > 模块/分组/key 包含 > 名称子序列。
 */
function scoreMenu(menu: SearchableMenuItem, tokens: string[]): number {
  const name = menu.name.toLowerCase()
  const haystack = `${menu.name} ${menu.groupName} ${menu.subName} ${menu.key}`.toLowerCase()
  let total = 0
  for (const token of tokens) {
    if (name.startsWith(token)) {
      total += 100
    } else if (name.includes(token)) {
      total += 60
    } else if (haystack.includes(token)) {
      total += 35
    } else if (isSubsequence(name, token)) {
      total += 20
    } else {
      return -1
    }
  }
  return total
}

/** 模糊匹配 + 相关性排序的结果 */
const results = computed<SearchableMenuItem[]>(() => {
  const kw = trimmedKeyword.value.toLowerCase()
  if (!kw) {
    return []
  }
  const tokens = kw.split(/\s+/).filter(Boolean)
  return allMenus.value
    .map(menu => ({ menu, score: scoreMenu(menu, tokens) }))
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.menu)
})

/** 结果副标题：所属模块 · 二级分组 */
function groupLabel(menu: SearchableMenuItem): string {
  return menu.subName ? `${menu.groupName} · ${menu.subName}` : menu.groupName
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

onLoad(() => {
  allMenus.value = getSearchableMenus()
})
</script>
