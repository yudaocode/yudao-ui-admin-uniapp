<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我的关注"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 类型页签 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTypeChange">
        <wd-tab v-for="tab in typeTabs" :key="tab.label" :title="tab.label" />
      </wd-tabs>
    </view>

    <!-- 关注列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无关注内容"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-8rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view class="flex shrink-0 items-center gap-12rpx">
              <wd-tag type="primary" plain>
                {{ getKnowledgeObjectTypeName(item.type) }}
              </wd-tag>
              <wd-icon name="star-fill" size="36rpx" color="#fa8c16" @click.stop="handleCancelFavorite(item)" />
            </view>
          </view>
          <view v-if="item.description" class="mb-8rpx truncate text-26rpx text-[#999]">
            {{ item.description }}
          </view>
          <view v-if="item.fileType || item.fileSize != null" class="mb-8rpx text-24rpx text-[#999]">
            <text v-if="item.fileType">{{ item.fileType.toUpperCase() }}</text>
            <text v-if="item.fileType && item.fileSize != null"> · </text>
            <text v-if="item.fileSize != null">{{ formatKnowledgeFileSize(item.fileSize) }}</text>
          </view>
          <view class="flex items-center justify-between text-26rpx text-[#666]">
            <text class="min-w-0 flex-1 truncate">{{ item.libraryName }}</text>
            <text class="shrink-0 text-24rpx text-[#999]">关注于 {{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
          <view class="mt-4rpx text-24rpx text-[#999]">
            内容更新于 {{ formatDateTime(item.targetUpdateTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeInteractionItem } from '@/api/pms/kb/interaction/favorite'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteKnowledgeFavorite, getKnowledgeFavoritePage } from '@/api/pms/kb/interaction/favorite'
import { PmsKnowledgeObjectType } from '@/pages-pms/kb/utils/constants'
import { formatKnowledgeFileSize, getKnowledgeObjectTypeName } from '@/pages-pms/kb/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0) // 当前类型页签下标
const typeTabs = [ // 对象类型页签
  { label: '全部', type: undefined },
  { label: '知识库', type: PmsKnowledgeObjectType.LIBRARY },
  { label: '文档', type: PmsKnowledgeObjectType.DOCUMENT },
  { label: '文件夹', type: PmsKnowledgeObjectType.FOLDER },
  { label: '文件', type: PmsKnowledgeObjectType.FILE },
]
const list = ref<KnowledgeInteractionItem[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询关注列表分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getKnowledgeFavoritePage({
      pageNo,
      pageSize,
      type: typeTabs[tabIndex.value].type,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 切换关注类型 */
function handleTypeChange() {
  pagingRef.value?.reload()
}

/** 打开内容详情 */
function handleDetail(item: KnowledgeInteractionItem) {
  if (item.type === PmsKnowledgeObjectType.LIBRARY) {
    uni.navigateTo({ url: `/pages-pms/kb/library/home/index?libraryId=${item.libraryId}` })
    return
  }
  if (item.documentId) {
    uni.navigateTo({ url: `/pages-pms/kb/library/document/index?id=${item.documentId}` })
    return
  }
  uni.navigateTo({ url: `/pages-pms/kb/library/folder/index?libraryId=${item.libraryId}&id=${item.folderId}` })
}

/** 取消关注 */
async function handleCancelFavorite(item: KnowledgeInteractionItem) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认取消关注“${item.name}”吗？` })
  } catch {
    return
  }
  await deleteKnowledgeFavorite(item.type, item.entityId)
  toast.success('已取消关注')
  pagingRef.value?.reload()
}
</script>
