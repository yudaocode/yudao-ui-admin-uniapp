<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="频道消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 消息列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无推送记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
          @longpress="handleLongPress(item)"
        >
          <view class="flex gap-20rpx p-24rpx">
            <wd-img
              v-if="item.materialCoverUrl"
              :src="item.materialCoverUrl"
              width="120rpx"
              height="120rpx"
              radius="12rpx"
              mode="aspectFill"
            />
            <view v-else class="h-120rpx w-120rpx flex items-center justify-center rounded-12rpx bg-[#f0f2f5] text-24rpx text-[#bbb]">
              无封面
            </view>
            <view class="min-w-0 flex-1">
              <view class="line-clamp-1 text-30rpx text-[#333] font-semibold">
                {{ item.materialTitle || '-' }}
              </view>
              <view class="mt-10rpx text-26rpx text-[#999]">
                频道：{{ item.channelName || '-' }}
              </view>
              <view class="mt-6rpx flex items-center justify-between text-24rpx text-[#999]">
                <text>接收：{{ getReceiverText(item) }}</text>
                <text>{{ formatDateTime(item.sendTime) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 推送按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['im:manager:channel-message:send'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleSend"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerChannelMessageVO } from '@/api/im/manager/channel/message'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteManagerChannelMessage, getManagerChannelMessagePage } from '@/api/im/manager/channel/message'
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
const dialog = useDialog()
const toast = useToast()
const list = ref<ImManagerChannelMessageVO[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 接收人展示文案 */
function getReceiverText(item: ImManagerChannelMessageVO) {
  return item.receiverUserIds?.length ? `${item.receiverUserIds.length} 人` : '全员'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询消息列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerChannelMessagePage({
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
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 推送频道消息 */
function handleSend() {
  uni.navigateTo({
    url: '/pages-im/manager/channel/message/send/index',
  })
}

/** 查看频道消息详情 */
function handleDetail(item: ImManagerChannelMessageVO) {
  uni.navigateTo({ url: `/pages-im/manager/channel/message/detail/index?id=${item.id}` })
}

/** 长按删除 */
async function handleLongPress(item: ImManagerChannelMessageVO) {
  if (!hasAccessByCodes(['im:manager:channel-message:delete'])) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该推送记录吗？',
    })
  } catch {
    return
  }
  await deleteManagerChannelMessage(item.id)
  toast.success('删除成功')
  reload()
}

/** 注册频道消息变更监听 */
onMounted(() => {
  uni.$on('im:manager:channel-message:reload', reload)
})

/** 移除频道消息变更监听 */
onUnload(() => {
  uni.$off('im:manager:channel-message:reload', reload)
})
</script>
