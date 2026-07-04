<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="告警配置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 告警配置列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无告警配置数据"
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
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">告警级别：</text>
            <dict-tag :type="DICT_TYPE.IOT_ALERT_LEVEL" :value="item.level" />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">关联规则：</text>
            {{ item.sceneRuleIds?.length || 0 }} 条
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">接收人：</text>
            {{ formatReceiveUserNames(item.receiveUserNames) }}
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">接收类型：</text>
            <view class="flex flex-wrap gap-8rpx">
              <dict-tag
                v-for="receiveType in item.receiveTypes"
                :key="receiveType"
                :type="DICT_TYPE.IOT_ALERT_RECEIVE_TYPE"
                :value="receiveType"
              />
              <text v-if="!item.receiveTypes?.length">-</text>
            </view>
          </view>
          <view class="text-24rpx text-[#999]">
            创建时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['iot:alert-config:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { AlertConfig } from '@/api/iot/alert/config'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getAlertConfigPage } from '@/api/iot/alert/config'
import { useAccess } from '@/hooks/useAccess'
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

const { hasAccessByCodes } = useAccess()
const list = ref<AlertConfig[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询告警配置列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getAlertConfigPage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增告警配置 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-iot/alert/config/form/index' })
}

/** 查看详情 */
function handleDetail(item: AlertConfig) {
  uni.navigateTo({ url: `/pages-iot/alert/config/detail/index?id=${item.id}` })
}

/** 格式化接收人 */
function formatReceiveUserNames(names?: string[]) {
  return names?.length ? names.join('、') : '-'
}

/** 初始化 */
onMounted(() => {
  uni.$on('iot:alert-config:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('iot:alert-config:reload', reload)
})
</script>
