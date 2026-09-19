<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我收到的"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm show-read-status @search="handleQuery" @reset="handleReset" />

    <!-- 公告列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无公告数据"
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
            <view class="mb-16rpx flex items-center justify-between">
              <view class="flex items-center gap-12rpx">
                <wd-tag v-if="item.top" type="danger" plain>
                  置顶
                </wd-tag>
                <text
                  class="line-clamp-1 text-32rpx text-[#333]"
                  :class="item.readStatus ? '' : 'font-semibold'"
                >
                  {{ item.title }}
                </text>
              </view>
              <wd-tag :type="item.readStatus ? 'success' : 'warning'">
                {{ item.readStatus ? '已读' : '未读' }}
              </wd-tag>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">公告类型：</text>
              <dict-tag :type="DICT_TYPE.OA_ANNOUNCEMENT_TYPE" :value="item.type" />
              <wd-tag v-if="item.forwarded" class="ml-16rpx" type="primary" plain>
                已转发
              </wd-tag>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">优先级：</text>
              <dict-tag :type="DICT_TYPE.OA_PRIORITY" :value="item.priority" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">发布人：</text>
              <text class="line-clamp-1">{{ item.publisherUserName || '-' }}</text>
              <text v-if="item.publisherDeptName" class="ml-16rpx text-24rpx text-[#999]">{{ item.publisherDeptName }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">发布时间：</text>
              <text>{{ formatDateTime(item.createTime) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Announcement } from '@/api/oa/announcement'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getReceivedAnnouncementPage } from '@/api/oa/announcement'
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

const list = ref<Announcement[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询公告列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getReceivedAnnouncementPage(params)
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

/** 查看详情（接收人视角，打开后标记已读） */
function handleDetail(item: Announcement) {
  uni.navigateTo({
    url: `/pages-oa/announcement/detail/index?id=${item.id}&scene=received`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:announcement:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:announcement:reload', reload)
})
</script>
