<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="常见问题"
      left-arrow
      placeholder
      safe-area-inset-top
      fixed
      @click-left="handleBack"
    />

    <!-- 搜索框 -->
    <wd-search
      v-model="searchValue"
      placeholder="请输入你想咨询的问题"
      placeholder-left
      hide-cancel
      light
    />

    <!-- FAQ Tabs -->
    <wd-tabs v-model="activeTab" auto-line-width>
      <wd-tab
        v-for="(category, index) in faqList"
        :key="index"
        :title="category.title"
        :name="index"
      >
        <view class="min-h-[calc(100vh-300rpx)] bg-white">
          <wd-collapse v-model="activeNames" custom-class="faq-collapse">
            <wd-collapse-item
              v-for="(item, idx) in filteredList(category.childList)"
              :key="idx"
              :name="`${index}-${idx}`"
            >
              <template #title>
                <view class="flex items-center">
                  <wd-icon name="edit-outline" size="18px" color="#1890ff" class="mr-16rpx" />
                  <text>{{ item.title }}</text>
                </view>
              </template>
              <view class="text-28rpx text-gray-500 leading-relaxed">
                {{ item.content }}
              </view>
            </wd-collapse-item>
          </wd-collapse>
        </view>
      </wd-tab>
    </wd-tabs>
  </view>
</template>

<script lang="ts" setup>
import type { FaqItem } from './data'
import { ref } from 'vue'
import { faqList } from './data'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const activeTab = ref<number>(0) // 当前选中的 Tab
const searchValue = ref('') // 搜索关键词
const activeNames = ref<string[]>([]) // 展开的问题

/** 过滤问题列表 */
function filteredList(list: FaqItem[]) {
  if (!searchValue.value) {
    return list
  }
  return list.filter(item =>
    item.title.includes(searchValue.value) || item.content.includes(searchValue.value),
  )
}

/** 返回上一页 */
function handleBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
:deep(.faq-collapse) {
  background: #fff;

  .wd-collapse-item__header {
    padding: 24rpx;
  }

  .wd-collapse-item__wrapper {
    background: #f9fafb;
  }
}
</style>
