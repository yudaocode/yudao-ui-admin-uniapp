<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="OTA 固件" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 固件列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无固件数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
              {{ item.name || '-' }}
            </view>
            <view class="shrink-0 text-24rpx text-[#999]">
              #{{ item.id }}
            </view>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">版本号：</text>
            {{ item.version || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">所属产品：</text>
            {{ item.productName || item.productId || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">文件大小：</text>
            {{ formatFileSize(item.fileSize) }}
          </view>
          <view class="mb-16rpx text-24rpx text-[#999]">
            创建时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view class="flex justify-end">
            <wd-button size="small" type="primary" variant="plain" @click.stop="handleDownload(item)">
              下载固件
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['iot:ota-firmware:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { OtaFirmware } from '@/api/iot/ota/firmware'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getOtaFirmwarePage } from '@/api/iot/ota/firmware'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { formatFileSize, openAttachment } from '@/utils/download'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<OtaFirmware[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询固件列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getOtaFirmwarePage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增固件 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-iot/ota/firmware/form/index' })
}

/** 查看详情 */
function handleDetail(item: OtaFirmware) {
  uni.navigateTo({ url: `/pages-iot/ota/firmware/detail/index?id=${item.id}` })
}

/** 打开固件文件 */
function handleDownload(item: OtaFirmware) {
  openAttachment(item.fileUrl)
}

/** 初始化 */
onMounted(() => {
  uni.$on('iot:ota-firmware:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('iot:ota-firmware:reload', reload)
})
</script>
