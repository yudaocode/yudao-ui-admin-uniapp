<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="生产排产" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 甘特图入口 -->
    <view class="bg-white px-24rpx py-16rpx">
      <wd-button type="primary" block variant="plain" @click="handleGanttEdit">
        甘特图编辑
      </wd-button>
    </view>

    <!-- 待排产工单列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无待排产工单" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in flatList" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  <text v-if="item.level > 0" class="mr-8rpx text-24rpx text-[#999]">子工单</text>{{ item.name || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="item.status" />
            </view>
            <view class="mb-14rpx flex flex-wrap gap-10rpx">
              <dict-tag v-if="item.orderSourceType != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE" :value="item.orderSourceType" />
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_TYPE" :value="item.type" />
              <wd-tag v-if="item.parentCode" type="default" plain>
                父工单 {{ item.parentCode }}
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>产品：{{ item.productCode || '-' }} / {{ item.productName || '-' }}</view>
              <view>规格：{{ item.productSpecification || '-' }} / 单位：{{ item.unitMeasureName || '-' }}</view>
              <view>数量：{{ item.quantity ?? '-' }}，已排产：{{ item.quantityScheduled ?? 0 }}，已生产：{{ item.quantityProduced ?? 0 }}</view>
              <view v-if="item.clientName">
                客户：{{ item.clientCode || '-' }} / {{ item.clientName }}
              </view>
              <view>需求日期：{{ formatDate(item.requestDate) || '-' }}</view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getWorkOrderPage } from '@/api/mes/pro/workorder'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesProWorkOrderStatusEnum, MesProWorkOrderTypeEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { handleTree } from '@/utils/tree'
import SearchForm from './components/search-form.vue'

interface FlatWorkOrder extends ProWorkOrder {
  level: number
}

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<ProWorkOrder[]>([]) // 待排产工单树
const pagingRef = ref<ZPagingRef<ProWorkOrder>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const flatList = computed<FlatWorkOrder[]>(() => flattenWorkOrders(list.value))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 展平父子工单 */
function flattenWorkOrders(rows: ProWorkOrder[], level = 0): FlatWorkOrder[] {
  return rows.flatMap((item) => {
    const current = { ...item, level }
    const children = item.children?.length ? flattenWorkOrders(item.children, level + 1) : []
    return [current, ...children]
  })
}

/** 合并 PC 固定排产筛选 */
function buildBaseQuery(): Record<string, any> {
  return {
    ...queryParams.value,
    status: MesProWorkOrderStatusEnum.CONFIRMED,
    type: MesProWorkOrderTypeEnum.SELF,
  }
}

/** 构造待排产工单分页查询 */
function buildPageQuery(pageNo: number, pageSize: number) {
  return {
    ...buildBaseQuery(),
    pageNo,
    pageSize,
  }
}

/** 查询待排产工单 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWorkOrderPage(buildPageQuery(pageNo, pageSize))
    list.value = handleTree(data.list, 'id', 'parentId')
    pagingRef.value?.completeByTotal(list.value, data.total)
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

/** 打开排产详情 */
function handleDetail(item: ProWorkOrder) {
  uni.navigateTo({ url: `/pages-mes/pro/task/detail/index?id=${item.id}&mode=detail` })
}

/** 打开甘特图编辑 */
function handleGanttEdit() {
  uni.navigateTo({ url: '/pages-mes/pro/task/edit/index' })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:pro:task:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:pro:task:reload', reload)
})
</script>
