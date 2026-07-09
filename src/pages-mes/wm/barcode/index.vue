<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 条码管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 顶部操作 -->
    <view v-if="hasTopActions" class="bg-white px-24rpx py-16rpx">
      <view class="grid grid-cols-3 gap-16rpx">
        <wd-button
          v-if="hasAccessByCodes(['mes:wm-barcode:create'])"
          block variant="plain" @click="handleAdd"
        >
          新增条码
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:wm-barcode-config:query'])"
          block variant="plain" @click="handleConfig"
        >
          条码设置
        </wd-button>
      </view>
    </view>

    <!-- 列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无条码数据"
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
            <BarcodePreview class="mb-20rpx" :content="item.content" :format="item.format" :show-actions="false" />
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.bizCode || item.content || '-' }}
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">条码格式：</text>
              <dict-tag v-if="item.format != null" :type="DICT_TYPE.MES_WM_BARCODE_FORMAT" :value="item.format" />
              <text v-else>-</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">业务类型：</text>
              <dict-tag v-if="item.bizType != null" :type="DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE" :value="item.bizType" />
              <text v-else>-</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">条码内容：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.content || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">业务编码：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.bizCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">业务名称：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.bizName || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">创建时间：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.createTime) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WmBarcode } from '@/api/mes/wm/barcode'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getBarcodePage } from '@/api/mes/wm/barcode'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import BarcodePreview from './components/barcode-preview.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<WmBarcode[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmBarcode>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const hasTopActions = computed(() => {
  return hasAccessByCodes(['mes:wm-barcode:create'])
    || hasAccessByCodes(['mes:wm-barcode-config:query'])
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getBarcodePage(params)
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
  uni.navigateTo({
    url: '/pages-mes/wm/barcode/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmBarcode) {
  uni.navigateTo({
    url: `/pages-mes/wm/barcode/detail/index?id=${item.id}`,
  })
}

/** 条码设置 */
function handleConfig() {
  uni.navigateTo({
    url: '/pages-mes/wm/barcode/config/index',
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:barcode:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:barcode:reload', reload)
})
</script>
