<template>
  <view>
    <!-- 搜索组件 -->
    <FileSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 文件列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="p-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <view class="line-clamp-1 text-32rpx text-[#333] font-semibold">
              {{ item.name || item.path }}
            </view>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">文件路径：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.path }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">文件类型：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.type || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">文件大小：</text>
            <text>{{ formatFileSize(item.size) }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">上传时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
          <view v-if="item.type && item.type.includes('image')" class="mb-12rpx">
            <wd-img
              :src="item.url"
              mode="aspectFit"
              width="100%"
              height="200rpx"
              enable-preview
              @click.stop
            />
          </view>
          <!-- 操作按钮 -->
          <view class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button size="small" type="info" @click.stop="handleCopyUrl(item)">
              复制链接
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['infra:file:delete'])"
              size="small" type="error" @click.stop="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无文件数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <!-- 上传按钮 -->
    <wd-fab
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleUpload"
    />
  </view>
</template>

<script lang="ts" setup>
import type { LoadMoreState } from '@/http/types'
import { ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { uploadFile } from '@/api/infra/file'
import { useAccess } from '@/hooks/useAccess'
import { http } from '@/http/http'
import { formatDateTime } from '@/utils/date'
import { formatFileSize } from '@/utils/download'
import FileSearchForm from './file-search-form.vue'

/** 文件信息 */
interface FileInfo {
  id?: number
  configId?: number
  path: string
  name?: string
  url?: string
  size?: number
  type?: string
  createTime?: Date
}

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const total = ref(0)
const list = ref<FileInfo[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})

/** 查询列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await http.get<{ list: FileInfo[], total: number }>('/infra/file/page', queryParams.value)
    list.value = [...list.value, ...data.list]
    total.value = data.total
    loadMoreState.value = list.value.length >= total.value ? 'finished' : 'loading'
  } catch {
    queryParams.value.pageNo = queryParams.value.pageNo > 1 ? queryParams.value.pageNo - 1 : 1
    loadMoreState.value = 'error'
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    ...data,
    pageNo: 1,
    pageSize: queryParams.value.pageSize,
  }
  list.value = []
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
  queryParams.value.pageNo++
  getList()
}

/** 上传文件 */
function handleUpload() {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      try {
        toast.loading('上传中...')
        await uploadFile(filePath)
        toast.success('上传成功')
        // 刷新列表
        handleQuery()
      } catch {
        toast.show('上传失败')
      }
    },
  })
}

/** 复制链接 */
function handleCopyUrl(item: FileInfo) {
  if (!item.url) {
    toast.show('文件 URL 为空')
    return
  }
  uni.setClipboardData({
    data: item.url,
    success: () => {
      toast.success('复制成功')
    },
  })
}

/** 查看详情 */
function handleDetail(item: FileInfo) {
  uni.navigateTo({
    url: `/pages-infra/file/detail/index?id=${item.id}`,
  })
}

/** 删除文件 */
function handleDelete(item: FileInfo) {
  uni.showModal({
    title: '提示',
    content: `确定要删除文件"${item.name || item.path}"吗？`,
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      try {
        toast.loading('删除中...')
        await http.delete(`/infra/file/delete?id=${item.id}`)
        toast.success('删除成功')
        // 刷新列表
        handleQuery()
      } catch {
        toast.show('删除失败')
      }
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
