<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 升级任务列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无升级任务数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view class="shrink-0">
              <dict-tag :type="DICT_TYPE.IOT_OTA_TASK_STATUS" :value="item.status" />
            </view>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">固件版本：</text>
            {{ item.firmwareVersion || item.firmwareId || '-' }}
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">升级范围：</text>
            <dict-tag :type="DICT_TYPE.IOT_OTA_TASK_DEVICE_SCOPE" :value="item.deviceScope" />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">升级进度：</text>
            {{ item.deviceSuccessCount || 0 }}/{{ item.deviceTotalCount || 0 }}
          </view>
          <view class="text-24rpx text-[#999]">
            创建时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['iot:ota-task:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { OtaTask } from '@/api/iot/ota/task'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getOtaTaskPage } from '@/api/iot/ota/task'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  firmwareId?: number | any
  productId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const firmwareId = props.firmwareId ? Number(props.firmwareId) : undefined // 入口预置固件
const productId = props.productId ? Number(props.productId) : undefined // 入口预置产品
const getTitle = firmwareId ? '固件升级任务' : 'OTA 任务'
const list = ref<OtaTask[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>(getDefaultQuery()) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询升级任务列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getOtaTaskPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...getDefaultQuery(), ...data }
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

/** 新增升级任务 */
function handleAdd() {
  const query = [
    firmwareId ? `firmwareId=${firmwareId}` : '',
    productId ? `productId=${productId}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-iot/ota/task/form/index${query ? `?${query}` : ''}` })
}

/** 查看详情 */
function handleDetail(item: OtaTask) {
  uni.navigateTo({ url: `/pages-iot/ota/task/detail/index?id=${item.id}` })
}

/** 默认查询参数 */
function getDefaultQuery() {
  return firmwareId ? { firmwareId } : {}
}

/** 初始化 */
onMounted(() => {
  uni.$on('iot:ota-task:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('iot:ota-task:reload', reload)
})
</script>
