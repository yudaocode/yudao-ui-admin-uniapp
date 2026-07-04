<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="结算账户"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 结算账户列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无结算账户数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="erp-list-card relative mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view class="flex items-center gap-8rpx">
                <wd-tag v-if="item.defaultStatus" type="primary" plain>
                  默认
                </wd-tag>
                <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
              </view>
            </view>
            <view class="mb-12rpx flex text-28rpx text-[#666]">
              <view class="min-w-0 flex-1">
                <text class="mr-8rpx text-[#999]">编码：</text>{{ item.no || '-' }}
              </view>
              <view class="w-180rpx text-right">
                <text class="mr-8rpx text-[#999]">排序：</text>{{ item.sort ?? '-' }}
              </view>
            </view>
            <view v-if="item.remark" class="mb-12rpx flex text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">备注：</text>
              <text class="line-clamp-1 min-w-0 flex-1">{{ item.remark }}</text>
            </view>
            <view v-if="item.createTime" class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">创建时间：</text>
              <text>{{ formatDateTime(item.createTime) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['erp:account:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Account } from '@/api/erp/finance/account'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getAccountPage } from '@/api/erp/finance/account'
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
const list = ref<Account[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询结算账户列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getAccountPage(params)
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

/** 新增结算账户 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-erp/finance/account/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: Account) {
  uni.navigateTo({
    url: `/pages-erp/finance/account/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('erp:account:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:account:reload', reload)
})
</script>
