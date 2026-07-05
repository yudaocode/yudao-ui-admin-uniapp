<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="工作站" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 工作站列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无工作站数据"
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
              <view>所在车间：{{ item.workshopName || '-' }}</view>
              <view>所属工序：{{ item.processName || '-' }}</view>
              <view>地点：{{ item.address || '-' }}</view>
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
      v-if="hasAccessByCodes(['mes:md-workstation:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MdWorkstation } from '@/api/mes/md/workstation'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getWorkstationPage } from '@/api/mes/md/workstation'
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
const list = ref<MdWorkstation[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<MdWorkstation>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询工作站列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWorkstationPage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增工作站 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-mes/md/workstation/form/index` })
}

/** 查看详情 */
function handleDetail(item: MdWorkstation) {
  uni.navigateTo({ url: `/pages-mes/md/workstation/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:md:workstation:reload', reload)
})

/** 卸载监听 */
onUnload(() => {
  uni.$off('mes:md:workstation:reload', reload)
})
</script>
