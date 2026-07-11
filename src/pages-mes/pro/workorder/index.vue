<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="生产工单" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 生产工单列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无生产工单数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  <text v-if="item.parentId" class="mr-8rpx text-24rpx text-[#999]">子工单</text>{{ item.name || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="item.status" />
            </view>
            <view class="mb-14rpx flex flex-wrap gap-10rpx">
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_TYPE" :value="item.type" />
              <dict-tag v-if="item.orderSourceType != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE" :value="item.orderSourceType" />
              <wd-tag v-if="item.parentCode" type="default" plain>
                父工单 {{ item.parentCode }}
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>产品：{{ item.productCode || '-' }} / {{ item.productName || '-' }}</view>
              <view>规格：{{ item.productSpecification || '-' }} / 单位：{{ item.unitMeasureName || '-' }}</view>
              <view>数量：{{ item.quantity ?? '-' }}，已生产：{{ item.quantityProduced ?? 0 }}，已排产：{{ item.quantityScheduled ?? 0 }}</view>
              <view v-if="item.clientName">
                客户：{{ item.clientCode || '-' }} / {{ item.clientName }}
              </view>
              <view v-if="item.vendorName">
                供应商：{{ item.vendorCode || '-' }} / {{ item.vendorName }}
              </view>
              <view>需求日期：{{ formatDate(item.requestDate) || '-' }}</view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['mes:pro-work-order:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getWorkOrderPage } from '@/api/mes/pro/workorder'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ProWorkOrder[]>([]) // 工单列表
const pagingRef = ref<ZPagingRef<ProWorkOrder>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询生产工单列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWorkOrderPage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增生产工单 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/pro/workorder/form/index' })
}

/** 查看详情 */
function handleDetail(item: ProWorkOrder) {
  uni.navigateTo({ url: `/pages-mes/pro/workorder/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:pro:workorder:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:pro:workorder:reload', reload)
})
</script>
