<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我的消息"
      placeholder safe-area-inset-top fixed
    />

    <!-- 搜索组件 -->
    <SearchForm
      :search-params="queryParams"
      @search="handleQuery"
      @reset="handleReset"
      @read-all="handleReadAll"
    />

    <!-- 消息列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="p-24rpx">
          <!-- 消息头部 -->
          <view class="mb-16rpx flex items-center justify-between">
            <view class="flex items-center">
              <view
                v-if="!item.readStatus"
                class="mr-12rpx h-16rpx w-16rpx rounded-full bg-red-500"
              />
              <view class="text-32rpx text-[#333] font-semibold">
                {{ item.templateNickname }}
              </view>
            </view>
            <wd-tag v-if="item.readStatus" type="success" plain>
              已读
            </wd-tag>
            <wd-tag v-else type="warning" plain>
              未读
            </wd-tag>
          </view>
          <!-- 消息内容 -->
          <view class="mb-12rpx rounded-8rpx bg-[#f7f8f9] p-20rpx">
            <view class="line-clamp-1 mb-8rpx text-30rpx text-[#323333] font-bold">
              {{ getDictLabel(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE, item.templateType) }}
            </view>
            <view class="line-clamp-2 text-28rpx text-[#777]">
              {{ item.templateContent }}
            </view>
          </view>
          <!-- 消息时间 -->
          <view class="flex items-center justify-between text-26rpx text-[#999]">
            <text>{{ formatDateTime(item.createTime) }}</text>
            <view
              v-if="!item.readStatus"
              class="text-[#1890ff]"
              @click.stop="handleReadOne(item)"
            >
              标记已读
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无消息" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <!-- 详情弹窗 -->
    <DetailPopup ref="detailPopupRef" />
  </view>
</template>

<script lang="ts" setup>
import type { SearchFormData } from './components/search-form.vue'
import type { NotifyMessage } from '@/api/system/notify'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import {
  getMyNotifyMessagePage,
  updateAllNotifyMessageRead,
  updateNotifyMessageRead,
} from '@/api/system/notify'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange, formatDateTime } from '@/utils/date'
import DetailPopup from './components/detail-popup.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const total = ref(0)
const list = ref<NotifyMessage[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  readStatus: -1 as number, // -1 表示全部
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
})
const detailPopupRef = ref<InstanceType<typeof DetailPopup>>() // 详情弹窗

/** 查询消息列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const params: any = { ...queryParams }
    if (queryParams.readStatus !== -1) {
      params.readStatus = queryParams.readStatus === 1
    } else {
      delete params.readStatus
    }
    params.createTime = formatDateRange(queryParams.createTime)
    const data = await getMyNotifyMessagePage(params)
    list.value = [...list.value, ...data.list]
    total.value = data.total
    loadMoreState.value = list.value.length >= total.value ? 'finished' : 'loading'
  } catch {
    queryParams.pageNo = queryParams.pageNo > 1 ? queryParams.pageNo - 1 : 1
    loadMoreState.value = 'error'
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: SearchFormData) {
  queryParams.readStatus = data?.readStatus ?? -1
  queryParams.createTime = data?.createTime ?? [undefined, undefined]
  queryParams.pageNo = 1
  list.value = [] // 清空列表
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 加载更多 */
function loadMore() {
  if (loadMoreState.value === 'finished') {
    return
  }
  queryParams.pageNo++
  getList()
}

/** 查看详情 */
function handleDetail(item: NotifyMessage) {
  // 如果未读，先标记已读
  if (!item.readStatus) {
    handleReadOne(item, false)
  }
  // 打开详情弹窗
  detailPopupRef.value?.open(item)
}

/** 标记单条已读 */
async function handleReadOne(item: NotifyMessage, showToast = true) {
  await updateNotifyMessageRead(item.id)
  // 更新本地状态
  item.readStatus = true
  item.readTime = new Date().toISOString()
  if (showToast) {
    toast.success('已标记为已读')
  }
}

/** 标记全部已读 */
function handleReadAll() {
  uni.showModal({
    title: '提示',
    content: '确定要将所有消息标记为已读吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      await updateAllNotifyMessageRead()
      toast.success('全部已读成功')
      // 刷新列表
      queryParams.pageNo = 1
      list.value = []
      await getList()
    },
  })
}

/** 触底加载更多 */
onReachBottom(() => {
  loadMore()
})

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
</style>
