<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="数据流转" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab v-for="item in tabItems" :key="item.key" :title="item.title" />
      </wd-tabs>
    </view>

    <template v-if="hasDataRuleAccess">
      <!-- 搜索组件 -->
      <SearchForm @search="handleQuery" @reset="handleReset" />

      <!-- 数据规则列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无数据规则数据"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name }}
              </view>
              <view class="shrink-0">
                <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
              </view>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">数据源：</text>{{ item.sourceConfigs?.length || 0 }} 个
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">数据目的：</text>{{ item.sinkIds?.length || 0 }} 个
            </view>
            <view class="text-24rpx text-[#999]">
              创建时间：{{ formatDateTime(item.createTime) || '-' }}
            </view>
          </view>
        </view>
      </z-paging>
    </template>
    <view v-else class="flex flex-1 items-center justify-center">
      <wd-empty icon="content" tip="暂无数据规则权限" />
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['iot:data-rule:create']) && hasDataRuleAccess"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { DataRule } from '@/api/iot/rule/data/rule'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getDataRulePage } from '@/api/iot/rule/data/rule'
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
const tabIndex = ref(hasAccessByCodes(['iot:data-sink:query']) ? 1 : 0) // 当前 tab
const list = ref<DataRule[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const hasDataSinkAccess = computed(() => hasAccessByCodes(['iot:data-sink:query'])) // 是否可查看数据目的
const hasDataRuleAccess = computed(() => hasAccessByCodes(['iot:data-rule:query'])) // 是否可查看数据规则
const tabItems = computed(() => { // 有权限的 tab
  const items: Array<{ key: string, title: string, url: string }> = []
  if (hasDataSinkAccess.value) {
    items.push({ key: 'sink', title: '数据目的', url: '/pages-iot/rule/data/sink/index' })
  }
  if (hasDataRuleAccess.value) {
    items.push({ key: 'rule', title: '数据规则', url: '/pages-iot/rule/data/rule/index' })
  }
  return items
})

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  const tab = tabItems.value[index]
  if (tab?.key === 'sink') {
    uni.redirectTo({ url: tab.url })
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询数据规则列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!hasDataRuleAccess.value) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getDataRulePage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增数据规则 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-iot/rule/data/rule/form/index' })
}

/** 查看详情 */
function handleDetail(item: DataRule) {
  uni.navigateTo({ url: `/pages-iot/rule/data/rule/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  if (!hasDataRuleAccess.value && hasDataSinkAccess.value) {
    uni.redirectTo({ url: '/pages-iot/rule/data/sink/index' })
    return
  }
  uni.$on('iot:data-rule:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('iot:data-rule:reload', reload)
})
</script>
