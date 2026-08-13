<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="财务指标"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="fmsStore.accountSet">
      <!-- 账套切换 -->
      <view class="p-24rpx pb-0">
        <AccountSetSwitch @change="reload" />
      </view>

      <!-- 财务指标列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :refresher-enabled="true"
        empty-view-text="暂无财务指标数据"
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
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name }}
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">指标编码：</text>{{ item.code }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">取数报表：</text>{{ formatFmsFinanceIndicatorType(item.type) }}
            </view>
            <view class="mb-12rpx truncate text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">指标公式：</text>{{ item.formula }}
            </view>
            <view class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">展示顺序：</text>{{ item.sort }}
            </view>
          </view>
        </view>
      </z-paging>

      <!-- 新增按钮 -->
      <wd-fab
        v-if="canCreate"
        position="right-bottom"
        type="primary"
        :expandable="false"
        @click="handleAdd"
      />
    </template>

    <!-- 无可用账套引导 -->
    <AccountSetGuide v-else-if="fmsStore.accountSetListLoaded" />
  </view>
</template>

<script lang="ts" setup>
import type { FinanceIndicator } from '@/api/fms/config/finance-indicator'
import { onUnload } from '@dcloudio/uni-app'
import { getFinanceIndicatorList } from '@/api/fms/config/finance-indicator'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { formatFmsFinanceIndicatorType } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const list = ref<FinanceIndicator[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 当前账套可写且有新增权限时才允许新增 */
const canCreate = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:finance-indicator:create']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询财务指标列表（账套级全量列表，不分页） */
async function queryList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getFinanceIndicatorList(accountSetId)
    pagingRef.value?.complete(data)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增财务指标 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-fms/config/finance-indicator/form/index' })
}

/** 查看详情 */
function handleDetail(item: FinanceIndicator) {
  uni.navigateTo({ url: `/pages-fms/config/finance-indicator/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  uni.$on('fms:config:finance-indicator:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:finance-indicator:reload', reload)
})
</script>
