<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="回收站"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 类型页签 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always">
        <wd-tab v-for="item in tabsWithCount" :key="item.key" :title="item.title" />
      </wd-tabs>
    </view>

    <!-- 提示 -->
    <view class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fffbe6] p-20rpx text-26rpx text-[#fa8c16]">
      恢复时会保留此前单独删除的子项；彻底删除后无法恢复。内容最多保留 30 天，之后将被永久删除。
    </view>

    <!-- 内容回收站的知识库选择 -->
    <view v-if="activeTab !== 'library'" class="mx-24rpx mt-16rpx">
      <LibrarySearchPicker
        v-model="contentLibraryId"
        :all-option="false"
        @change="handleContentLibraryChange"
      />
    </view>

    <!-- 回收站列表 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx pb-200rpx">
        <view v-if="!displayList.length" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无回收站内容
        </view>
        <view
          v-for="item in displayList"
          :key="item.id"
          class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-8rpx flex items-center justify-between gap-16rpx">
            <text
              class="min-w-0 flex-1 truncate text-30rpx font-semibold"
              :class="activeTab === 'library' ? 'text-[#333]' : 'text-[#1677ff]'"
              @click="handleDetail(item)"
            >
              {{ item.name }}
            </text>
            <wd-tag type="danger" plain>
              {{ getKnowledgeObjectTypeName(item.type) }}
            </wd-tag>
          </view>
          <view class="mb-12rpx text-24rpx text-[#999]">
            {{ item.deleteUserName || '-' }} 删除于 {{ formatDateTime(item.deleteTime) || '-' }}
            <text v-if="item.fileSize != null"> · {{ formatKnowledgeFileSize(item.fileSize) }}</text>
          </view>
          <view class="flex justify-end gap-16rpx">
            <wd-button size="small" variant="plain" @click="handleRestore(item)">
              恢复
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click="handlePermanentDelete(item)">
              彻底删除
            </wd-button>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 回收站详情弹窗 -->
    <wd-popup v-model="detailVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view v-if="detail" class="flex flex-col" :style="{ maxHeight: '80vh' }">
        <view class="p-32rpx pb-16rpx">
          <view class="mb-8rpx text-center text-32rpx text-[#333] font-semibold">
            {{ detail.root.name }}
          </view>
          <view class="text-center text-24rpx text-[#999]">
            删除于 {{ detail.root.deleteTime ? formatDateTime(detail.root.deleteTime) : '未知时间' }}
          </view>
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1 px-32rpx">
          <view class="mb-12rpx text-26rpx text-[#666]">
            级联删除内容（{{ detail.children.length }}）
          </view>
          <view v-if="!detail.children.length" class="py-40rpx text-center text-26rpx text-[#999]">
            该对象没有级联删除内容
          </view>
          <view
            v-for="child in detail.children"
            :key="child.id"
            class="mb-12rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] p-20rpx"
          >
            <wd-icon
              :name="child.type === PmsKnowledgeObjectType.FOLDER ? 'folder' : child.type === PmsKnowledgeObjectType.FILE ? 'file' : 'textarea'"
              size="32rpx"
              :color="child.type === PmsKnowledgeObjectType.FOLDER ? '#fa8c16' : '#1677ff'"
            />
            <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ child.name }}</text>
            <text
              v-if="child.type !== PmsKnowledgeObjectType.FOLDER"
              class="shrink-0 text-26rpx text-[#1677ff]"
              @click="handlePreview(child.id)"
            >
              预览
            </text>
          </view>
        </scroll-view>
        <view class="flex gap-24rpx p-32rpx pt-16rpx">
          <wd-button class="flex-1" variant="plain" @click="detailVisible = false">
            关闭
          </wd-button>
          <wd-button class="flex-1" type="primary" variant="plain" @click="handleRestore(detail.root)">
            恢复
          </wd-button>
          <wd-button class="flex-1" type="danger" @click="handlePermanentDelete(detail.root)">
            彻底删除
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 内容预览弹窗 -->
    <wd-popup v-model="previewVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="flex flex-col" :style="{ maxHeight: '70vh' }">
        <view class="p-32rpx pb-16rpx text-center text-32rpx text-[#333] font-semibold">
          {{ preview?.name || '内容预览' }}
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1 px-32rpx">
          <template v-if="preview">
            <!-- 富文本消毒后渲染；纯文本（移动端自产）保留换行 -->
            <rich-text v-if="preview.content && isHtmlContent(preview.content)" :nodes="sanitizeRichText(preview.content)" />
            <view v-else-if="preview.content" class="whitespace-pre-wrap break-all text-28rpx text-[#333]">
              {{ preview.content }}
            </view>
            <view v-else class="py-40rpx text-center text-26rpx text-[#999]">
              该内容暂无可预览数据
            </view>
            <wd-button
              v-if="preview.type === PmsKnowledgeObjectType.FILE && preview.content"
              class="mt-24rpx" block type="primary" variant="plain"
              @click="openFile(preview.content)"
            >
              打开文件预览
            </wd-button>
          </template>
        </scroll-view>
        <view class="p-32rpx pt-16rpx">
          <wd-button block variant="plain" @click="previewVisible = false">
            关闭
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeLibrary } from '@/api/pms/kb/library'
import type {
  KnowledgeRecycle,
  KnowledgeRecycleDetail,
  KnowledgeRecyclePreview,
} from '@/api/pms/kb/recycle'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getKnowledgeLibraryPage } from '@/api/pms/kb/library'
import {
  getKnowledgeContentRecycleDetail,
  getKnowledgeContentRecycleList,
  getKnowledgeContentRecyclePreview,
  getKnowledgeLibraryRecycleList,
  permanentDeleteKnowledgeRecycle,
  restoreKnowledgeRecycle,
} from '@/api/pms/kb/recycle'
import LibrarySearchPicker from '@/pages-pms/kb/library/components/library-search-picker.vue'
import { PmsKnowledgeObjectType } from '@/pages-pms/kb/utils/constants'
import { formatKnowledgeFileSize, getKnowledgeObjectTypeName } from '@/pages-pms/kb/utils/format'
import { navigateBackPlus } from '@/utils'
import { isHtmlContent, sanitizeRichText } from '@/utils/format'
import { openFile } from '@/utils/download'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  libraryId?: number | any // 从知识库主页进入时锁定内容回收站
  tab?: string // 初始页签
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0) // 当前类型页签下标
const tabs = [ // 对象类型页签
  { key: 'library', title: '知识库', type: PmsKnowledgeObjectType.LIBRARY },
  { key: 'document', title: '文档', type: PmsKnowledgeObjectType.DOCUMENT },
  { key: 'folder', title: '文件夹', type: PmsKnowledgeObjectType.FOLDER },
  { key: 'file', title: '文件', type: PmsKnowledgeObjectType.FILE },
]
const libraryList = ref<KnowledgeRecycle[]>([]) // 知识库回收站列表
const contentList = ref<KnowledgeRecycle[]>([]) // 内容回收站列表
const contentLibraryId = ref<number>() // 内容回收站的知识库编号
const detailVisible = ref(false) // 详情弹窗显示状态
const previewVisible = ref(false) // 预览弹窗显示状态
const detail = ref<KnowledgeRecycleDetail>() // 回收站详情
const preview = ref<KnowledgeRecyclePreview>() // 回收站内容预览

const tabsWithCount = computed(() => // 带数量徽标的页签
  tabs.map(tab => ({
    ...tab,
    title: tab.key === 'library'
      ? `${tab.title}(${libraryList.value.length})`
      : `${tab.title}(${contentList.value.filter(item => item.type === tab.type).length})`,
  })),
)
const activeTab = computed(() => tabs[tabIndex.value].key) // 当前页签
const displayList = computed(() => {
  if (activeTab.value === 'library') {
    return libraryList.value
  }
  const type = tabs[tabIndex.value].type
  return contentList.value.filter(item => item.type === type)
}) // 当前页签的回收站记录

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询知识库回收站列表 */
async function getLibraryList() {
  libraryList.value = await getKnowledgeLibraryRecycleList()
}

/** 查询内容回收站列表 */
async function getContentList() {
  if (!contentLibraryId.value) {
    contentList.value = []
    return
  }
  contentList.value = await getKnowledgeContentRecycleList(contentLibraryId.value)
}

/** 切换内容回收站知识库 */
function handleContentLibraryChange(_item?: KnowledgeLibrary) {
  getContentList()
}

/** 查看本次删除对象的级联内容 */
async function handleDetail(item: KnowledgeRecycle) {
  if (activeTab.value === 'library') {
    return
  }
  detail.value = await getKnowledgeContentRecycleDetail(item.id)
  detailVisible.value = true
}

/** 预览回收站内容 */
async function handlePreview(entityId: number) {
  if (!detail.value) {
    return
  }
  preview.value = await getKnowledgeContentRecyclePreview(detail.value.root.id, entityId)
  previewVisible.value = true
}

/** 恢复回收站记录 */
async function handleRestore(item: KnowledgeRecycle) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认恢复“${item.name}”吗？` })
  } catch {
    return
  }
  await restoreKnowledgeRecycle(item.id)
  toast.success('恢复成功')
  detailVisible.value = false
  await reload()
}

/** 彻底删除回收站记录 */
async function handlePermanentDelete(item: KnowledgeRecycle) {
  try {
    await dialog.confirm({ title: '提示', msg: `彻底删除后不可恢复，确认删除“${item.name}”吗？` })
  } catch {
    return
  }
  await permanentDeleteKnowledgeRecycle(item.id)
  toast.success('彻底删除成功')
  detailVisible.value = false
  await reload()
}

/** 刷新当前页签列表 */
async function reload() {
  await Promise.all([getLibraryList(), getContentList()])
}

/** 初始化 */
onMounted(async () => {
  if (props.tab === 'content') {
    tabIndex.value = 1
  }
  if (props.libraryId) {
    contentLibraryId.value = Number(props.libraryId)
  } else {
    // 默认选中第一个可访问的知识库
    const page = await getKnowledgeLibraryPage({ pageNo: 1, pageSize: 1 })
    contentLibraryId.value = page.list[0]?.id
  }
  await reload()
})
</script>
