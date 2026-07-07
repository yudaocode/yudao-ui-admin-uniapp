<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="来料检验单（IQC）" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 来料检验单列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无来料检验单数据"
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
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.code || '-' }}
              </view>
              <view class="mt-8rpx truncate text-24rpx text-[#999]">
                {{ item.name || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.MES_ORDER_STATUS" :value="item.status" />
          </view>

          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">供应商：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.vendorNickname || '-' }}</text>
          </view>
          <view v-if="item.vendorBatch" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">供应商批次：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.vendorBatch }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">产品物料：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.itemCode || '-' }} / {{ item.itemName || '-' }}</text>
          </view>
          <view v-if="item.itemSpecification || item.unitName" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">规格单位：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.itemSpecification || '-' }} / {{ item.unitName || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">数量：</text>
            <text class="min-w-0 flex-1 truncate">
              接收 {{ item.receivedQuantity ?? '-' }}，检测 {{ item.checkQuantity ?? '-' }}，不合格 {{ item.unqualifiedQuantity ?? '-' }}
            </text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">检测结果：</text>
            <dict-tag v-if="item.checkResult != null" :type="DICT_TYPE.MES_QC_CHECK_RESULT" :value="item.checkResult" />
            <text v-else>-</text>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">来料日期：</text>{{ formatDateTime(item.receiveDate) || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">检测日期：</text>{{ formatDateTime(item.inspectDate) || '-' }}
          </view>
          <view v-if="item.inspectorNickname" class="mb-16rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">检测人员：</text>{{ item.inspectorNickname }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:qc-iqc:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { QcIqc } from '@/api/mes/qc/iqc'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getIqcPage } from '@/api/mes/qc/iqc'
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
const list = ref<QcIqc[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<QcIqc>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getIqcPage({ ...queryParams.value, pageNo, pageSize })
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
  uni.navigateTo({ url: '/pages-mes/qc/iqc/form/index' })
}

/** 查看详情 */
function handleDetail(item: QcIqc) {
  uni.navigateTo({ url: `/pages-mes/qc/iqc/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:qc:iqc:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:qc:iqc:reload', reload)
})
</script>
