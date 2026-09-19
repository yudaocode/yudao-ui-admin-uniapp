<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="通讯录"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 类型页签 -->
    <wd-tabs v-model="tabIndex" @change="handleTabChange">
      <wd-tab
        v-for="tab in tabs"
        :key="tab.value"
        :title="tab.title"
      />
    </wd-tabs>

    <!-- 分类筛选 -->
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
      <view class="flex-shrink-0 px-24rpx" @click="handleCategoryManage">
        <text class="text-26rpx text-[#1677ff]">管理分类</text>
      </view>
    </view>

    <!-- 搜索组件 -->
    <SearchForm :show-handle-status="scene === 'received'" @search="handleQuery" @reset="handleReset" />

    <!-- 联系人列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无联系人数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="scene === 'sent' ? `${item.id}-${item.share?.id ?? 0}` : item.id"
          class="mb-24rpx rounded-12rpx bg-white"
          @click="handleDetail(item)"
        >
          <view class="flex items-center gap-20rpx p-24rpx">
            <wd-img
              v-if="item.avatar"
              :src="item.avatar"
              :width="44"
              :height="44"
              mode="aspectFill"
              round
            />
            <view
              v-else
              class="h-88rpx w-88rpx flex shrink-0 items-center justify-center rounded-full bg-[#1890ff] text-32rpx text-white"
            >
              {{ item.name?.charAt(0) }}
            </view>
            <view class="min-w-0 flex-1">
              <view class="mb-8rpx flex items-center justify-between">
                <text class="line-clamp-1 text-32rpx text-[#333] font-semibold">{{ item.name }}</text>
                <wd-tag v-if="scene === 'received'" :type="item.handleStatus ? 'success' : 'warning'">
                  {{ item.handleStatus ? '已处理' : '待处理' }}
                </wd-tag>
                <wd-tag v-else-if="scene === 'sent'" :type="item.share?.handleStatus ? 'success' : 'warning'">
                  {{ item.share?.handleStatus ? '已处理' : '待处理' }}
                </wd-tag>
              </view>
              <view class="line-clamp-1 text-26rpx text-[#666]">
                {{ item.mobile || '-' }}
                <text v-if="item.companyName"> · {{ item.companyName }}</text>
              </view>
              <view class="line-clamp-1 mt-8rpx text-24rpx text-[#999]">
                <template v-if="scene === 'received'">
                  来自：{{ item.sharerName || item.ownerUserName || '-' }}<text v-if="item.sharedCategoryName"> · {{ item.sharedCategoryName }}</text>
                </template>
                <template v-else-if="scene === 'sent'">
                  接收人：{{ item.share?.userName || '-' }}<text v-if="item.share?.createTime"> · {{ formatDateTime(item.share.createTime) }}</text>
                </template>
                <template v-else>
                  分类：{{ item.categoryName || '未分类' }}
                </template>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="scene === 'mine' && hasAccessByCodes(['oa:contact:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Contact } from '@/api/oa/contact'
import type { ContactCategory } from '@/api/oa/contact/category'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getMyContactPage, getReceivedContactPage, getSharedContactPage } from '@/api/oa/contact'
import { getSimpleContactCategoryList } from '@/api/oa/contact/category'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const tabs = [ // 类型页签，与 PC 左侧类型导航一致
  { value: 'mine', title: '我的联系人' },
  { value: 'received', title: '共享与我' },
  { value: 'sent', title: '我共享的' },
]
const tabIndex = ref(0) // 当前页签下标
const scene = ref('mine') // 当前场景：mine 我的 / received 共享与我 / sent 我共享的
const list = ref<Contact[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const categoryList = ref<ContactCategory[]>([]) // 分类选项
const categoryId = ref<number | undefined>() // 当前选中的分类编号

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询联系人列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      categoryId: categoryId.value,
      pageNo,
      pageSize,
    }
    const data = scene.value === 'received'
      ? await getReceivedContactPage(params)
      : scene.value === 'sent'
        ? await getSharedContactPage(params)
        : await getMyContactPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 页签切换：处理状态只属于共享与我场景，切走时清掉 */
function handleTabChange({ index }: { index: number }) {
  scene.value = tabs[index]!.value
  if (scene.value !== 'received') {
    delete queryParams.value.handleStatus
  }
  reload()
}

/** 分类切换 */
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

/** 加载分类选项 */
async function loadCategories() {
  categoryList.value = await getSimpleContactCategoryList()
}

/** 新增联系人 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/contact/form/index',
  })
}

/** 管理分类 */
function handleCategoryManage() {
  uni.navigateTo({
    url: '/pages-oa/contact/category/index',
  })
}

/** 查看详情 */
function handleDetail(item: Contact) {
  uni.navigateTo({
    url: `/pages-oa/contact/detail/index?id=${item.id}&scene=${scene.value}`,
  })
}

/** 初始化 */
onMounted(() => {
  loadCategories()
  uni.$on('oa:contact:reload', reload)
  uni.$on('oa:contact-category:reload', loadCategories)
})

/** 返回时刷新分类（分类管理页返回后不触发 reload 事件）；首次显示跳过，避免与 onMounted 双发 */
let firstShow = true
onShow(() => {
  if (firstShow) {
    firstShow = false
    return
  }
  loadCategories()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:contact:reload', reload)
  uni.$off('oa:contact-category:reload', loadCategories)
})
</script>
