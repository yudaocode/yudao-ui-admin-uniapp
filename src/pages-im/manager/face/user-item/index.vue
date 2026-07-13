<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="用户表情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 用户表情列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无用户表情数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @longpress="handleLongPress(item)"
        >
          <view class="flex items-center gap-20rpx p-24rpx">
            <wd-img
              v-if="item.url"
              :src="item.url"
              width="100rpx"
              height="100rpx"
              radius="12rpx"
              mode="aspectFit"
            />
            <view class="min-w-0 flex-1">
              <view class="line-clamp-1 text-30rpx text-[#333] font-semibold">
                {{ item.name || '未命名' }}
              </view>
              <view class="mt-8rpx text-26rpx text-[#999]">
                {{ item.userNickname || `用户 ${item.userId}` }}
              </view>
              <view class="mt-6rpx flex items-center justify-between text-24rpx text-[#999]">
                <text>{{ item.width && item.height ? `${item.width} × ${item.height}` : '-' }}</text>
                <text>{{ formatDateTime(item.createTime) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerFaceUserItemVO } from '@/api/im/manager/face/userItem'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteManagerFaceUserItem, getManagerFaceUserItemPage } from '@/api/im/manager/face/userItem'
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
const list = ref<ImManagerFaceUserItemVO[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询用户表情列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerFaceUserItemPage({
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

/** 长按删除 */
async function handleLongPress(item: ImManagerFaceUserItemVO) {
  if (!hasAccessByCodes(['im:manager:face-user-item:delete'])) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该用户表情吗？',
    })
  } catch {
    return
  }
  await deleteManagerFaceUserItem(item.id)
  toast.success('删除成功')
  reload()
}

/** 注册用户表情变更监听 */
onMounted(() => {
  uni.$on('im:manager:face-user-item:reload', reload)
})

/** 移除用户表情变更监听 */
onUnload(() => {
  uni.$off('im:manager:face-user-item:reload', reload)
})
</script>
