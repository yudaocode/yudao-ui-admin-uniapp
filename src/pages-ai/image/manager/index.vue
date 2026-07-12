<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="绘图管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 绘图列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无绘图记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <wd-img
            v-if="item.picUrl"
            :src="item.picUrl"
            width="100%"
            height="420rpx"
            mode="aspectFill"
          />
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="line-clamp-2 text-30rpx text-[#333] font-semibold">
                  {{ item.prompt || `#${item.id}` }}
                </view>
                <view class="mt-8rpx text-22rpx text-[#999]">
                  {{ formatDateTime(item.createTime) }}
                </view>
              </view>
              <dict-tag :type="DICT_TYPE.AI_IMAGE_STATUS" :value="item.status" />
            </view>
            <view class="text-24rpx text-[#999]">
              用户：{{ getUserName(item.userId) }} / {{ item.platform || '-' }} / {{ item.model || '-' }}
            </view>
            <view v-if="item.errorMessage" class="line-clamp-3 mt-12rpx text-24rpx text-[#f56c6c]">
              {{ item.errorMessage }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ImageVO } from '@/api/ai/image'
import type { User } from '@/api/system/user'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getImagePage } from '@/api/ai/image'
import { getSimpleUserList } from '@/api/system/user'
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

const list = ref<ImageVO[]>([]) // 绘图列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const userList = ref<User[]>([]) // 用户精简列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询绘图列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getImagePage(params)
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

/** 查看绘图详情 */
function handleDetail(item: ImageVO) {
  uni.navigateTo({
    url: `/pages-ai/image/manager/detail/index?id=${item.id}`,
  })
}

/** 获取用户昵称 */
function getUserName(userId?: number) {
  return userList.value.find(user => user.id === userId)?.nickname || String(userId || '-')
}

/** 初始化 */
onMounted(async () => {
  uni.$on('ai:image:reload', reload)
  userList.value = await getSimpleUserList().catch(() => [])
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:image:reload', reload)
})
</script>
