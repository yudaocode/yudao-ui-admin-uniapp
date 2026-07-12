<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="navbarTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 分段列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无分段数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                分段 #{{ item.id }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="text-26rpx text-[#666]">
            <view class="line-clamp-4">
              {{ item.content || '-' }}
            </view>
            <view class="mt-12rpx text-24rpx text-[#999]">
              文档：{{ documentName || props.documentId || '-' }} / Token {{ item.tokens ?? 0 }}
            </view>
          </view>
          <view class="mt-20rpx text-24rpx text-[#999]">
            <text>召回 {{ item.retrievalCount ?? 0 }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['ai:knowledge:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeSegment } from '@/api/ai/knowledge/segment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getKnowledgeSegmentPage } from '@/api/ai/knowledge/segment'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  documentId?: number | any
  knowledgeId?: number | any
  documentName?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const list = ref<KnowledgeSegment[]>([]) // 列表数据
const queryParams = ref<Record<string, any>>({}) // 查询参数
const pagingRef = ref<any>() // 分页组件引用
const documentName = computed(() => props.documentName ? decodeURIComponent(props.documentName) : '') // 文档名称
const navbarTitle = computed(() => documentName.value ? `${documentName.value} · 分段` : '分段')

/** 返回上一页 */
function handleBack() {
  const query = [
    props.knowledgeId ? `knowledgeId=${props.knowledgeId}` : '',
  ].filter(Boolean).join('&')
  navigateBackPlus(`/pages-ai/knowledge/document/index${query ? `?${query}` : ''}`)
}

/** 查询分段列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.documentId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const params = {
      ...queryParams.value,
      documentId: props.documentId ? Number(props.documentId) : undefined,
      pageNo,
      pageSize,
    }
    const data = await getKnowledgeSegmentPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增分段 */
function handleAdd() {
  if (!props.documentId) {
    toast.warning('缺少文档编号')
    return
  }
  const query = [
    `documentId=${props.documentId}`,
    props.knowledgeId ? `knowledgeId=${props.knowledgeId}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-ai/knowledge/segment/form/index?${query}` })
}

/** 查看分段详情 */
function handleDetail(item: KnowledgeSegment) {
  const query = [
    `id=${item.id}`,
    props.documentId ? `documentId=${props.documentId}` : '',
    props.knowledgeId ? `knowledgeId=${props.knowledgeId}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-ai/knowledge/segment/detail/index?${query}` })
}

/** 初始化 */
onMounted(() => {
  if (!props.documentId) {
    toast.warning('缺少文档编号，无法查看分段')
  }
  uni.$on('ai:knowledge-segment:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:knowledge-segment:reload', reload)
})
</script>
