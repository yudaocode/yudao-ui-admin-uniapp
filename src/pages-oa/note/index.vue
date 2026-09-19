<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="笔记管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 场景页签 -->
    <wd-tabs v-model="tabIndex" @change="handleTabChange">
      <wd-tab
        v-for="tab in tabs"
        :key="tab.value"
        :title="tab.title"
      />
    </wd-tabs>

    <!-- 目录筛选 -->
    <view class="flex items-center bg-white">
      <scroll-view scroll-x class="min-w-0 flex-1 whitespace-nowrap">
        <view class="inline-flex items-center gap-16rpx px-24rpx py-16rpx">
          <view
            class="rounded-8rpx px-24rpx py-12rpx text-26rpx"
            :class="categoryId === undefined ? 'bg-[#1677ff] text-white' : 'bg-[#f5f5f5] text-[#666]'"
            @click="handleCategoryChange(undefined)"
          >
            全部
          </view>
          <view
            v-for="item in categoryList"
            :key="item.id"
            class="rounded-8rpx px-24rpx py-12rpx text-26rpx"
            :class="item.id === categoryId ? 'bg-[#1677ff] text-white' : 'bg-[#f5f5f5] text-[#666]'"
            @click="handleCategoryChange(item.id)"
          >
            {{ item.name }}
          </view>
        </view>
      </scroll-view>
      <view class="shrink-0 px-24rpx" @click="handleCategoryManage">
        <text class="text-26rpx text-[#1677ff]">管理目录</text>
      </view>
    </view>

    <!-- 搜索组件 -->
    <SearchForm :show-favorite="scene === 'mine'" @search="handleQuery" @reset="handleReset" />

    <!-- 笔记列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无笔记数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between gap-12rpx">
              <view class="min-w-0 flex flex-1 items-center gap-12rpx">
                <wd-icon v-if="item.favorite" name="star-fill" size="28rpx" color="#fa8c16" />
                <text class="line-clamp-1 text-32rpx text-[#333] font-semibold">{{ item.title }}</text>
              </view>
              <dict-tag :type="DICT_TYPE.OA_PRIORITY" :value="item.priority" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">笔记类型：</text>
              <dict-tag :type="DICT_TYPE.OA_NOTE_TYPE" :value="item.type" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">{{ scene === 'received' ? '创建人：' : '目录：' }}</text>
              <text class="line-clamp-1">
                {{ scene === 'received' ? (item.creatorUserName || '-') : (item.categoryName || '未分类') }}
              </text>
            </view>
            <view v-if="scene === 'mine' && item.receiverUserNames?.length" class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">共享给：</text>
              <text class="line-clamp-1">{{ item.receiverUserNames.join('、') }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">创建时间：</text>
              <text>{{ formatDateTime(item.createTime) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="scene === 'mine' && hasAccessByCodes(['oa:note:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Note } from '@/api/oa/note'
import type { NoteCategory } from '@/api/oa/note/category'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getMyNotePage, getReceivedNotePage } from '@/api/oa/note'
import { getSimpleNoteCategoryList } from '@/api/oa/note/category'
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
const tabs = [ // 场景页签，与 PC 笔记场景一致
  { value: 'mine', title: '我的笔记' },
  { value: 'received', title: '共享与我' },
]
const tabIndex = ref(0) // 当前页签下标
const scene = ref('mine') // 当前场景：mine 我的 / received 共享与我
const list = ref<Note[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const categoryList = ref<NoteCategory[]>([]) // 目录选项
const categoryId = ref<number | undefined>() // 当前选中的目录编号

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询笔记列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      categoryId: categoryId.value,
      pageNo,
      pageSize,
    }
    const data = scene.value === 'received'
      ? await getReceivedNotePage(params)
      : await getMyNotePage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 页签切换：共享与我场景没有目录和收藏概念，切换时清空对应筛选 */
function handleTabChange({ index }: { index: number }) {
  scene.value = tabs[index]!.value
  if (scene.value === 'received') {
    categoryId.value = undefined
    delete queryParams.value.favorite
  }
  reload()
}

/** 目录切换 */
function handleCategoryChange(id?: number) {
  categoryId.value = id
  reload()
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

/** 加载目录选项 */
async function loadCategories() {
  categoryList.value = await getSimpleNoteCategoryList()
}

/** 新增笔记 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/note/form/index',
  })
}

/** 管理目录 */
function handleCategoryManage() {
  uni.navigateTo({
    url: '/pages-oa/note/category/index',
  })
}

/** 查看详情 */
function handleDetail(item: Note) {
  uni.navigateTo({
    url: `/pages-oa/note/detail/index?id=${item.id}&scene=${scene.value}`,
  })
}

/** 初始化 */
onMounted(() => {
  loadCategories()
  uni.$on('oa:note:reload', reload)
  uni.$on('oa:note-category:reload', loadCategories)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:note:reload', reload)
  uni.$off('oa:note-category:reload', loadCategories)
})
</script>
