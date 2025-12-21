<template>
  <view>
    <!-- 搜索组件 -->
    <ConfigSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 文件配置列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="p-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <view class="text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view class="flex items-center gap-8rpx">
              <view v-if="item.master" class="rounded-4rpx bg-green-500 px-8rpx py-2rpx text-24rpx text-white">
                主配置
              </view>
              <dict-tag :type="DICT_TYPE.INFRA_FILE_STORAGE" :value="item.storage" />
            </view>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">配置编号：</text>
            <text>{{ item.id }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
          <!-- 操作按钮 -->
          <view class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button
              v-if="hasAccessByCodes(['infra:file-config:update']) && !item.master"
              size="small" type="info" @click.stop="handleMaster(item)"
            >
              设为主配置
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['infra:file-config:update'])"
              size="small" type="info" @click.stop="handleTest(item)"
            >
              测试
            </wd-button>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无文件配置数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['infra:file-config:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FileConfig } from '@/api/infra/file/config'
import type { LoadMoreState } from '@/http/types'
import { ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getFileConfigPage, testFileConfig, updateFileConfigMaster } from '@/api/infra/file/config'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ConfigSearchForm from './config-search-form.vue'

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const total = ref(0)
const list = ref<FileConfig[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})

/** 查询列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getFileConfigPage(queryParams.value)
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

/** 新增 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-infra/file/config/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: FileConfig) {
  uni.navigateTo({
    url: `/pages-infra/file/config/detail/index?id=${item.id}`,
  })
}

/** 测试文件配置 */
async function handleTest(item: FileConfig) {
  toast.loading('测试上传中...')
  const url = await testFileConfig(item.id!)
  toast.close()
  uni.showModal({
    title: '测试上传成功',
    content: '是否要访问该文件？',
    confirmText: '访问',
    success: (res) => {
      if (!res.confirm || !url) {
        return
      }
      // 复制链接到剪贴板
      uni.setClipboardData({
        data: url,
        success: () => {
          uni.hideToast()
          toast.success('链接已复制，请在浏览器中打开')
        },
      })
    },
  })
}

/** 设为主配置 */
function handleMaster(item: FileConfig) {
  uni.showModal({
    title: '提示',
    content: `是否要将"${item.name}"设为主配置？`,
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      try {
        toast.loading('设置中...')
        await updateFileConfigMaster(item.id!)
        toast.success('设置成功')
        // 刷新列表
        handleQuery()
      } catch {
        toast.close()
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
