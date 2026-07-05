<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="车间" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 车间列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无车间数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>编码：{{ item.code || '-' }}</view>
              <view>面积：{{ item.area ?? '-' }} ㎡</view>
              <view>负责人：{{ item.chargeUserName || '-' }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:md-workshop:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MdWorkshop } from '@/api/mes/md/workstation/workshop'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getWorkshopPage } from '@/api/mes/md/workstation/workshop'
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
const list = ref<MdWorkshop[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<MdWorkshop>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询车间列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWorkshopPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any> = {}) {
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

/** 新增车间 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-mes/md/workstation/workshop/form/index` })
}

/** 查看详情 */
function handleDetail(item: MdWorkshop) {
  uni.navigateTo({ url: `/pages-mes/md/workstation/workshop/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:md:workshop:reload', reload)
})

/** 卸载监听 */
onUnload(() => {
  uni.$off('mes:md:workshop:reload', reload)
})
</script>
