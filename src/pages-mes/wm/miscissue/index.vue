<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 其他出库管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无其他出库数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.code || '-' }}
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_MISC_ISSUE_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">出库单名称：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.name || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">业务类型：</text>
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_WM_MISC_ISSUE_TYPE" :value="item.type" />
              <text v-else>-</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">来源单据类型：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.sourceDocType || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">来源单据编号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.sourceDocCode || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">出库日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.issueDate) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:wm-misc-issue:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmMiscIssue } from '@/api/mes/wm/miscissue'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getMiscIssuePage } from '@/api/mes/wm/miscissue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<WmMiscIssue[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmMiscIssue>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getMiscIssuePage(params)
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

/** 新增 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-mes/wm/miscissue/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmMiscIssue) {
  uni.navigateTo({
    url: `/pages-mes/wm/miscissue/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:miscissue:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:miscissue:reload', reload)
})
</script>
