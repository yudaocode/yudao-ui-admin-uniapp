<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="仓库" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 仓库列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无仓库数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm" @click="handleDetail(item)">
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view v-if="item.frozen" class="text-24rpx text-[#f56c6c]">
                已冻结
              </view>
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>编码：{{ item.code || '-' }}</view>
              <view>面积：{{ item.area ?? '-' }} ㎡</view>
              <view>负责人：{{ item.chargeUserName || '-' }}</view>
              <view class="flex items-center">
                <text class="mr-8rpx">是否冻结：</text>
                <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(item.frozen)" />
              </view>
              <view v-if="item.address">
                地址：{{ item.address }}
              </view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['mes:wm-warehouse:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { WmWarehouse } from '@/api/mes/wm/warehouse'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getWarehousePage } from '@/api/mes/wm/warehouse'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<WmWarehouse[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmWarehouse>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
let userMapPromise: Promise<Map<number, string>> | undefined // 用户名称映射缓存

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询仓库列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const [data, userMap] = await Promise.all([
      getWarehousePage({ ...queryParams.value, pageNo, pageSize }),
      getUserMap(),
    ])
    const rows = data.list.map(item => ({ ...item, chargeUserName: item.chargeUserId == null ? null : userMap.get(item.chargeUserId) || null }))
    pagingRef.value?.completeByTotal(rows, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 获取用户名称映射 */
async function getUserMap() {
  userMapPromise ||= getSimpleUserList().then(users =>
    new Map(users.filter(user => user.id !== undefined).map(user => [user.id!, user.nickname])))
  return userMapPromise.catch((error) => {
    userMapPromise = undefined
    throw error
  })
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

/** 新增仓库 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/form/index` })
}

/** 查看详情 */
function handleDetail(item: WmWarehouse) {
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:warehouse:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:warehouse:reload', reload)
})
</script>
