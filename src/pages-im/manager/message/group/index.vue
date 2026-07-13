<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="群聊消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm
      :group-id="props.groupId ? Number(props.groupId) : undefined"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 群聊消息列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无群聊消息数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ item.groupName || `群 ${item.groupId}` }}
            </view>
            <dict-tag :type="DICT_TYPE.IM_CONTENT_TYPE" :value="item.type" />
          </view>
          <view class="mt-8rpx text-26rpx text-[#999]">
            发送人：{{ item.senderNickname || `用户 ${item.senderId}` }}
          </view>
          <view class="line-clamp-2 mt-8rpx text-26rpx text-[#666]">
            {{ getMessageSummary(item.type, item.content) }}
          </view>
          <view class="mt-12rpx flex items-center justify-between text-24rpx text-[#999]">
            <text>{{ formatDateTime(item.sendTime) }}</text>
            <text>{{ getDictLabel(DICT_TYPE.IM_MESSAGE_STATUS, item.status) }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerGroupMessageVO } from '@/api/im/manager/message/group'
import { ref } from 'vue'
import { getManagerGroupMessagePage } from '@/api/im/manager/message/group'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { getMessageSummary } from '@/pages-im/utils/message'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  groupId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<ImManagerGroupMessageVO[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  groupId: props.groupId ? Number(props.groupId) : undefined,
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询群聊消息列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerGroupMessagePage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
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
  handleQuery({
    groupId: props.groupId ? Number(props.groupId) : undefined,
  })
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看群聊消息详情 */
function handleDetail(item: ImManagerGroupMessageVO) {
  uni.navigateTo({
    url: `/pages-im/manager/message/group/detail/index?id=${item.id}`,
  })
}
</script>
