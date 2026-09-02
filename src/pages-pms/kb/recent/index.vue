<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="最近使用"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 时间分组页签 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 浏览列表 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <view v-if="!activeItems.length" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无浏览记录
        </view>
        <view
          v-for="item in activeItems"
          :key="item.id"
          class="mb-16rpx flex items-center gap-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <wd-icon
            :name="item.type === PmsKnowledgeObjectType.FOLDER ? 'folder' : item.type === PmsKnowledgeObjectType.FILE ? 'file' : 'textarea'"
            size="36rpx"
            :color="item.type === PmsKnowledgeObjectType.FOLDER ? '#fa8c16' : '#1677ff'"
            class="shrink-0"
          />
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333]">
              {{ item.name }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ getKnowledgeObjectTypeName(item.type) }} · {{ item.libraryName }}
            </view>
          </view>
          <text class="shrink-0 text-24rpx text-[#999]">{{ formatDateTime(item.createTime) || '-' }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeInteractionItem, KnowledgeRecentList } from '@/api/pms/kb/interaction/view-record'
import { computed, reactive, ref } from 'vue'
import { getKnowledgeRecentViewRecordList } from '@/api/pms/kb/interaction/view-record'
import { PmsKnowledgeObjectType } from '@/pages-pms/kb/utils/constants'
import { getKnowledgeObjectTypeName } from '@/pages-pms/kb/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabIndex = ref(0) // 当前时间分组页签下标
const tabs = [ // 时间分组页签
  { key: 'todayItems', title: '今天' },
  { key: 'yesterdayItems', title: '昨天' },
  { key: 'recent30DayItems', title: '最近 30 天' },
] as const
const recent = reactive<KnowledgeRecentList>({
  todayItems: [],
  yesterdayItems: [],
  recent30DayItems: [],
}) // 最近浏览数据

const activeItems = computed<KnowledgeInteractionItem[]>(() => recent[tabs[tabIndex.value].key]) // 当前时间分组的访问记录

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询最近浏览列表 */
async function getList() {
  Object.assign(recent, await getKnowledgeRecentViewRecordList())
}

/** 打开内容详情 */
function handleDetail(item: KnowledgeInteractionItem) {
  if (item.documentId) {
    uni.navigateTo({ url: `/pages-pms/kb/library/document/index?id=${item.documentId}` })
    return
  }
  uni.navigateTo({ url: `/pages-pms/kb/library/folder/index?libraryId=${item.libraryId}&id=${item.folderId}` })
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
