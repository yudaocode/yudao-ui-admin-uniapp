<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="工具台账" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 工具列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无工具数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm" @click="handleDetail(item)">
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.MES_TM_TOOL_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>编码：{{ item.code || '-' }}</view>
              <view>品牌/规格：{{ item.brand || '-' }} / {{ item.specification || '-' }}</view>
              <view>工具类型：{{ item.toolTypeName || '-' }}</view>
              <view>库存：{{ item.quantity ?? 0 }} / 可用：{{ item.availableQuantity ?? 0 }}</view>
              <view>保养维护：<dict-tag v-if="item.maintenType != null" :type="DICT_TYPE.MES_TM_MAINTEN_TYPE" :value="item.maintenType" /><text v-else>-</text></view>
              <view>下次保养：{{ formatNextMainten(item) }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['mes:tm-tool:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { TmTool } from '@/api/mes/tm/tool'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getToolPage } from '@/api/mes/tm/tool'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesMaintenTypeEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<TmTool[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<TmTool>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询工具列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getToolPage({ ...queryParams.value, pageNo, pageSize })
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

/** 下次保养展示 */
function formatNextMainten(item: TmTool) {
  if (item.maintenType === MesMaintenTypeEnum.REGULAR) {
    return formatDate(item.nextMaintenDate) || '-'
  }
  if (item.maintenType === MesMaintenTypeEnum.USAGE) {
    return item.nextMaintenPeriod != null ? `${item.nextMaintenPeriod} 次` : '-'
  }
  return '-'
}

/** 新增工具 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-mes/tm/tool/form/index` })
}

/** 查看详情 */
function handleDetail(item: TmTool) {
  uni.navigateTo({ url: `/pages-mes/tm/tool/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:tm:tool:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:tm:tool:reload', reload)
})
</script>
