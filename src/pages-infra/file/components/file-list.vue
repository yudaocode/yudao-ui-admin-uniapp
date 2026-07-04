<template>
  <view class="h-full min-h-0 flex flex-col">
    <!-- 搜索组件 -->
    <FileSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 文件列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无文件数据"
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
              <text class="min-w-0 flex-1 truncate">{{ item.type }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">文件大小：</text>
              <text>{{ formatFileSize(item.size) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">上传时间：</text>
              <text>{{ formatDateTime(item.createTime) }}</text>
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
              <wd-button size="small" type="primary" variant="plain" @click.stop="openFile(item.url)">
                打开
              </wd-button>
              <wd-button size="small" type="info" @click.stop="handleCopyUrl(item)">
                复制链接
              </wd-button>
              <wd-button
                v-if="hasAccessByCodes(['infra:file:delete'])"
                size="small" type="danger" @click.stop="handleDelete(item)"
              >
                删除
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

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
import type { FileVO } from '@/api/infra/file'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref } from 'vue'
import { deleteFile, getFilePage, uploadFile } from '@/api/infra/file'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'
import { formatFileSize, openFile } from '@/utils/download'
import FileSearchForm from './file-search-form.vue'

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<FileVO[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getFilePage(params)
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
        reload()
      } catch {
        toast.show('上传失败')
      }
    },
  })
}

/** 复制链接 */
function handleCopyUrl(item: FileVO) {
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
function handleDetail(item: FileVO) {
  uni.navigateTo({
    url: `/pages-infra/file/detail/index?id=${item.id}`,
  })
}

/** 删除文件 */
async function handleDelete(item: FileVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除文件"${item.name || item.path}"吗？`,
    })
  } catch {
    return
  }
  // 执行删除
  try {
    toast.loading('删除中...')
    await deleteFile(item.id!)
    toast.success('删除成功')
    // 刷新列表
    reload()
  } catch {
    toast.show('删除失败')
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('infra:file:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('infra:file:reload', reload)
})
</script>
