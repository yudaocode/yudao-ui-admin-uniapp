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

    <!-- 文档列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
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
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                知识库：{{ knowledgeName || item.knowledgeId || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="text-24rpx text-[#999]">
            字符 {{ item.contentLength ?? 0 }} / Token {{ item.tokens ?? 0 }} / 召回 {{ item.retrievalCount ?? 0 }}
          </view>
          <view class="mt-20rpx text-24rpx text-[#999]">
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
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
import type { KnowledgeDocument } from '@/api/ai/knowledge/document'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getKnowledgeDocumentPage } from '@/api/ai/knowledge/document'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  knowledgeId?: number | any
  knowledgeName?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const list = ref<KnowledgeDocument[]>([]) // 列表数据
const queryParams = ref<Record<string, any>>({}) // 查询参数
const pagingRef = ref<any>() // 分页组件引用

const knowledgeName = computed(() => props.knowledgeName ? decodeURIComponent(props.knowledgeName) : '') // 知识库名称
const navbarTitle = computed(() => knowledgeName.value ? `${knowledgeName.value} · 文档` : '文档') // 导航栏标题

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/knowledge/index')
}

/** 查询文档列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.knowledgeId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const params = {
      ...queryParams.value,
      knowledgeId: props.knowledgeId ? Number(props.knowledgeId) : undefined,
      pageNo,
      pageSize,
    }
    const data = await getKnowledgeDocumentPage(params)
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

/** 新增文档 */
function handleAdd() {
  if (!props.knowledgeId) {
    toast.warning('缺少知识库编号')
    return
  }
  uni.navigateTo({ url: `/pages-ai/knowledge/document/form/index?knowledgeId=${props.knowledgeId}` })
}

/** 查看文档详情 */
function handleDetail(item: KnowledgeDocument) {
  const query = [
    `id=${item.id}`,
    props.knowledgeId ? `knowledgeId=${props.knowledgeId}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-ai/knowledge/document/detail/index?${query}` })
}

/** 初始化 */
onMounted(() => {
  if (!props.knowledgeId) {
    toast.warning('缺少知识库编号，无法查看文档')
  }
  uni.$on('ai:knowledge-document:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:knowledge-document:reload', reload)
})
</script>
