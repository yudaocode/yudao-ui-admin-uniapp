<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="质检方案" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 质检方案列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无质检方案数据"
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
                {{ item.name || '-' }}
              </view>
              <view class="mt-8rpx truncate text-24rpx text-[#999]">
                {{ item.code || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-start text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">检测种类：</text>
            <view class="min-w-0 flex-1">
              <template v-if="item.types?.length">
                <dict-tag
                  v-for="type in item.types"
                  :key="type"
                  class="mb-8rpx mr-8rpx"
                  :type="DICT_TYPE.MES_QC_TYPE"
                  :value="type"
                />
              </template>
              <text v-else>-</text>
            </view>
          </view>
          <view v-if="item.remark" class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">备注：</text>{{ item.remark }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:qc-template:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { QcTemplate } from '@/api/mes/qc/template'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getTemplatePage } from '@/api/mes/qc/template'
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
const list = ref<QcTemplate[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<QcTemplate>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询质检方案列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTemplatePage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增质检方案 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/qc/template/form/index' })
}

/** 查看详情 */
function handleDetail(item: QcTemplate) {
  uni.navigateTo({ url: `/pages-mes/qc/template/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:qc:template:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:qc:template:reload', reload)
})
</script>
