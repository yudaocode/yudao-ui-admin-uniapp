<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="班组设置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
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
      empty-view-text="暂无班组数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.calendarType != null" :type="DICT_TYPE.MES_CAL_CALENDAR_TYPE" :value="item.calendarType" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
              <view>创建时间：{{ formatDateTime(item.createTime) || '-' }}</view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:cal-team:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { CalTeam } from '@/api/mes/cal/team'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getTeamPage } from '@/api/mes/cal/team'
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
const list = ref<CalTeam[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<CalTeam>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询班组列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTeamPage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增班组 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/cal/team/form/index' })
}

/** 查看详情 */
function handleDetail(item: CalTeam) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/team/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:cal:team:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:cal:team:reload', reload)
})
</script>
