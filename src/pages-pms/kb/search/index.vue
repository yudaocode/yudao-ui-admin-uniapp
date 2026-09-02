<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="文档搜索"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <view @click="visible = true">
        <wd-search :placeholder="placeholder" hide-cancel disabled />
      </view>
    </view>

    <!-- 文档列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无文档"
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
              {{ item.title }}
              <text v-if="item.fileSize != null" class="text-24rpx text-[#999]">
                （{{ formatKnowledgeFileSize(item.fileSize) }}）
              </text>
            </view>
            <dict-tag :type="DICT_TYPE.PMS_KNOWLEDGE_DOCUMENT_TYPE" :value="item.type" />
          </view>
          <!-- 摘要关键词高亮（对齐 PC <mark>，先剥 HTML 再消毒注入） -->
          <rich-text
            v-if="item.contentSummary"
            class="line-clamp-2 mb-12rpx text-26rpx text-[#999]"
            :nodes="highlightSummary(item.contentSummary)"
          />
          <view class="flex items-center justify-between text-26rpx text-[#666]">
            <text class="min-w-0 flex-1 truncate">{{ item.libraryName }} · {{ item.creatorUserName || '-' }}</text>
            <text class="shrink-0 text-24rpx text-[#999]">{{ formatDateTime(item.updateTime) || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 搜索弹窗 -->
    <wd-popup
      v-model="visible"
      position="top"
      :custom-style="getTopPopupStyle()"
      :modal-style="getTopPopupModalStyle()"
      @close="visible = false"
    >
      <view class="yd-search-form-container">
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            关键字
          </view>
          <wd-input v-model="formData.keyword" placeholder="请输入文档标题或正文" clearable />
        </view>
        <LibrarySearchPicker
          v-model="formData.libraryId"
          @change="item => (libraryName = item?.name || '')"
        />
        <UserSearchPicker
          v-model="formData.creatorUserId"
          label="创建人"
          placeholder="请选择创建人"
          @change="user => (creatorUserName = user?.nickname || '')"
        />
        <yd-search-date-range
          v-model="formData.updateTime"
          label="更新时间"
        />
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeDocument } from '@/api/pms/kb/content/document'
import { computed, reactive, ref } from 'vue'
import { getKnowledgeDocumentSearchPage } from '@/api/pms/kb/content/document'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import LibrarySearchPicker from '@/pages-pms/kb/library/components/library-search-picker.vue'
import { formatKnowledgeFileSize } from '@/pages-pms/kb/utils/format'
import { sanitizeRichText, stripHtmlTags } from '@/utils/format'
import { getTopPopupModalStyle, getTopPopupStyle, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange, formatDateTime } from '@/utils/date'

const props = defineProps<{
  libraryId?: number | any // 从知识库主页进入时限定当前知识库
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const visible = ref(false) // 搜索弹窗显示状态
const libraryName = ref('') // 已选知识库名称，用于 placeholder 展示
const creatorUserName = ref('') // 已选创建人名称，用于 placeholder 展示
const list = ref<KnowledgeDocument[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const formData = reactive({
  keyword: undefined as string | undefined,
  libraryId: props.libraryId ? Number(props.libraryId) : undefined as number | undefined,
  creatorUserId: undefined as number | undefined,
  updateTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索条件 placeholder 拼接
  const conditions: string[] = []
  if (formData.keyword) {
    conditions.push(`关键字:${formData.keyword}`)
  }
  if (formData.libraryId !== undefined) {
    conditions.push(`知识库:${libraryName.value || formData.libraryId}`)
  }
  if (formData.creatorUserId !== undefined) {
    conditions.push(`创建人:${creatorUserName.value || formData.creatorUserId}`)
  }
  if (formData.updateTime[0] || formData.updateTime[1]) {
    conditions.push(`更新:${formatDate(formData.updateTime[0]) || '?'}~${formatDate(formData.updateTime[1]) || '?'}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '请输入文档标题或正文'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询文档搜索分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getKnowledgeDocumentSearchPage({
      pageNo,
      pageSize,
      keyword: formData.keyword || undefined,
      libraryId: formData.libraryId,
      creatorUserId: formData.creatorUserId,
      updateTime: formatDateRange(formData.updateTime),
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  formData.keyword = undefined
  formData.libraryId = props.libraryId ? Number(props.libraryId) : undefined
  formData.creatorUserId = undefined
  formData.updateTime = [undefined, undefined]
  libraryName.value = ''
  creatorUserName.value = ''
  visible.value = false
  pagingRef.value?.reload()
}

/** 在摘要中高亮当前关键词（HTML 转义后注入 <mark>，再统一消毒） */
function highlightSummary(summary: string) {
  const text = stripHtmlTags(summary)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const keyword = (formData.keyword || '').trim()
  if (!keyword) {
    return text
  }
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return sanitizeRichText(text.replace(new RegExp(`(${escapedKeyword})`, 'gi'), '<mark style="background:#ffe58f">$1</mark>'))
}

/** 打开文档详情 */
function handleDetail(item: KnowledgeDocument) {
  uni.navigateTo({ url: `/pages-pms/kb/library/document/index?id=${item.id}` })
}
</script>
