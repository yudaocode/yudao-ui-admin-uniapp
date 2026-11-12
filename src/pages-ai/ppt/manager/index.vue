<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="PPT 管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- PPT 列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无 PPT 记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="flex gap-20rpx">
            <view class="h-124rpx w-220rpx shrink-0 overflow-hidden rounded-8rpx bg-[#f5f5f5]">
              <wd-img v-if="item.coverUrl" :src="item.coverUrl" width="220rpx" height="124rpx" mode="aspectFill" />
              <view v-else class="h-full w-full flex items-center justify-center">
                <wd-icon name="desktop" size="48rpx" color="#bbb" />
              </view>
            </view>
            <view class="min-w-0 flex-1">
              <view class="flex items-start justify-between gap-16rpx">
                <view class="line-clamp-2 text-28rpx text-[#333] font-semibold">
                  {{ item.title || '-' }}
                </view>
                <dict-tag :type="DICT_TYPE.AI_PPT_STATUS" :value="item.status" />
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                用户：{{ item.userNickname || '-' }} · {{ item.finishCount }} / {{ item.slideCount }} 页
              </view>
            </view>
          </view>
          <view v-if="item.status === AiPptStatusEnum.FAIL" class="line-clamp-2 mt-12rpx text-24rpx text-[#f5222d]">
            {{ item.errorMessage || '-' }}
          </view>
          <view class="mt-12rpx text-22rpx text-[#999]">
            {{ formatDateTime(item.createTime) }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Ppt } from '@/api/ai/ppt'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getPptPage } from '@/api/ai/ppt'
import { navigateBackPlus } from '@/utils'
import { AiPptStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<Ppt[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询 PPT 列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getPptPage(params)
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

/** 查看 PPT 详情 */
function handleDetail(item: Ppt) {
  uni.navigateTo({
    url: `/pages-ai/ppt/manager/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:ppt:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:ppt:reload', reload)
})
</script>
