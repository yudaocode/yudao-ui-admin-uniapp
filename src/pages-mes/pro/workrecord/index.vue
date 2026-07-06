<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="工作记录" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 当前工作状态 -->
    <WorkRecordStatusBar ref="statusBarRef" @change="reload" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无工作记录数据"
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
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.workstationName || '-' }}
                </view>
                <view class="mt-6rpx text-24rpx text-[#999]">
                  {{ item.workstationCode || '-' }} / #{{ item.id }}
                </view>
              </view>
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_PRO_WORK_RECORD_TYPE" :value="item.type" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>用户：{{ item.userNickname || '-' }}</view>
              <view>操作时间：{{ formatDateTime(item.createTime) || '-' }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ProWorkRecordLog } from '@/api/mes/pro/workrecord'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getWorkRecordLogPage } from '@/api/mes/pro/workrecord'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'
import WorkRecordStatusBar from './components/work-record-status-bar.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<ProWorkRecordLog[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<ProWorkRecordLog>>() // 分页组件引用
const statusBarRef = ref<InstanceType<typeof WorkRecordStatusBar>>() // 当前状态引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWorkRecordLogPage({
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
  statusBarRef.value?.loadCurrent()
}

/** 查看详情 */
function handleDetail(item: ProWorkRecordLog) {
  uni.navigateTo({
    url: `/pages-mes/pro/workrecord/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:pro:workrecord:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:pro:workrecord:reload', reload)
})
</script>
