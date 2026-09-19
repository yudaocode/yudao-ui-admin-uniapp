<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="讨论管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm :show-user="isSuperAdmin" @search="handleQuery" @reset="handleReset" />

    <!-- 讨论列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无讨论数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-8rpx flex items-center justify-between gap-12rpx">
            <text class="line-clamp-1 min-w-0 flex-1 text-32rpx text-[#333] font-semibold">{{ item.title }}</text>
            <dict-tag :type="DICT_TYPE.OA_DISCUSSION_TYPE" :value="item.type" />
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            {{ item.userName || '-' }} · {{ formatDateTime(item.createTime) }}
          </view>
          <view class="flex items-center gap-24rpx text-24rpx text-[#999]">
            <text>浏览 {{ item.visitCount || 0 }}</text>
            <text>回复 {{ item.replyCount || 0 }}</text>
            <text>点赞 {{ item.likeCount || 0 }}</text>
            <text v-if="item.fileUrls?.length">附件 {{ item.fileUrls.length }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 发布按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['oa:discussion:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Discussion } from '@/api/oa/discussion'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getDiscussionManagePage } from '@/api/oa/discussion'
import { useAccess } from '@/hooks/useAccess'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from '../components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const userStore = useUserStore() // 用户信息
const isSuperAdmin = computed(() => userStore.roles.includes('super_admin')) // 管理员可按发布人筛选
const list = ref<Discussion[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询讨论列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getDiscussionManagePage(params)
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

/** 发布讨论 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/discussion/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: Discussion) {
  uni.navigateTo({
    url: `/pages-oa/discussion/detail/index?id=${item.id}&scene=manage`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:discussion:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:discussion:reload', reload)
})
</script>
