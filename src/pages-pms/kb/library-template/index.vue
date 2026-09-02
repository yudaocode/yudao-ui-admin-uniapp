<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="知识库模板"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 模板列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无知识库模板"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleEdit(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="line-clamp-2 mb-12rpx text-26rpx text-[#666]">
            {{ item.description || '暂无简介' }}
          </view>
          <view class="flex items-center justify-between text-28rpx text-[#666]">
            <text>排序 {{ item.sort }}</text>
            <text class="shrink-0 text-24rpx text-[#999]">{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
          <view class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button
              v-if="hasAccessByCodes(['pms:kb:library-template:update'])"
              size="small" variant="plain"
              @click.stop="handleEdit(item)"
            >
              编辑
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['pms:kb:library-template:delete'])"
              size="small" type="danger" variant="plain"
              @click.stop="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['pms:kb:library-template:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeLibraryTemplate } from '@/api/pms/kb/library/template'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteKnowledgeLibraryTemplate, getKnowledgeLibraryTemplatePage } from '@/api/pms/kb/library/template'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<KnowledgeLibraryTemplate[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询知识库模板分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getKnowledgeLibraryTemplatePage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  queryParams.value = { ...data }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({})
}

/** 新增知识库模板 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-pms/kb/library-template/form/index' })
}

/** 编辑知识库模板 */
function handleEdit(item: KnowledgeLibraryTemplate) {
  if (!hasAccessByCodes(['pms:kb:library-template:update'])) {
    return
  }
  uni.navigateTo({ url: `/pages-pms/kb/library-template/form/index?id=${item.id}` })
}

/** 删除知识库模板 */
async function handleDelete(item: KnowledgeLibraryTemplate) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除模板“${item.name}”吗？` })
  } catch {
    return
  }
  await deleteKnowledgeLibraryTemplate(item.id!)
  toast.success('删除成功')
  pagingRef.value?.reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('pms:kb:library-template:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('pms:kb:library-template:reload', reload)
})
</script>
