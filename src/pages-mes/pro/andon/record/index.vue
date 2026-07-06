<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 安灯呼叫记录管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 操作入口 -->
    <view v-if="hasAccessByCodes(['mes:pro-andon-config:query'])" class="bg-white px-24rpx py-16rpx">
      <wd-button size="small" variant="plain" block @click="handleConfig">
        安灯设置
      </wd-button>
    </view>

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
      empty-view-text="暂无安灯呼叫记录数据"
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
                  {{ item.reason || '-' }}
                </view>
                <view class="mt-6rpx text-24rpx text-[#999]">
                  {{ item.workstationCode || '-' }} / {{ item.workstationName || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_PRO_ANDON_STATUS" :value="item.status" />
            </view>
            <view class="mb-14rpx flex flex-wrap gap-12rpx">
              <dict-tag v-if="item.level != null" :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="item.level" />
              <wd-tag v-if="item.workOrderCode" type="primary" plain>
                {{ item.workOrderCode }}
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>工序：{{ item.processName || '-' }}</view>
              <view>发起人：{{ item.userNickname || '-' }}</view>
              <view>发起时间：{{ formatDateTime(item.createTime) || '-' }}</view>
              <view>处置人：{{ item.handlerUserNickname || '-' }}</view>
              <view>处置时间：{{ formatDateTime(item.handleTime) || '-' }}</view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['mes:pro-andon-record:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { ProAndonRecord } from '@/api/mes/pro/andon/record'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getAndonRecordPage } from '@/api/mes/pro/andon/record'
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
const list = ref<ProAndonRecord[]>([]) // 列表数据
const pagingRef = ref() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getAndonRecordPage({
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

/** 新增 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/pro/andon/record/form/index?mode=create' })
}

/** 安灯设置 */
function handleConfig() {
  uni.navigateTo({ url: '/pages-mes/pro/andon/config/index' })
}

/** 查看详情 */
function handleDetail(item: ProAndonRecord) {
  uni.navigateTo({ url: `/pages-mes/pro/andon/record/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:pro:andon:record:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:pro:andon:record:reload', reload)
})
</script>
