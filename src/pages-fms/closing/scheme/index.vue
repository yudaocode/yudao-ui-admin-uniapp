<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="结账方案"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="fmsStore.accountSet">
      <!-- 账套切换 -->
      <view class="p-24rpx pb-0">
        <AccountSetSwitch @change="reload" />
      </view>

      <!-- 结账模板入口 -->
      <view
        class="mx-24rpx mb-24rpx flex items-center justify-between rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="handleTemplateList"
      >
        <view class="text-28rpx text-[#333]">
          结账模板
        </view>
        <wd-icon name="arrow-right" size="32rpx" color="#999" />
      </view>

      <!-- 结账方案列表（会计期间加载完成后再挂载分页组件） -->
      <z-paging
        v-if="fmsStore.currentMonth"
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :refresher-enabled="true"
        empty-view-text="暂无结账方案"
        @query="queryList"
      >
        <view class="p-24rpx pt-0">
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
              <wd-tag v-if="item.type === FmsClosingType.PROFIT_LOSS" type="primary" plain>
                结转损益
              </wd-tag>
              <wd-tag v-else-if="item.periodEnd" type="warning" plain>
                期末结转
              </wd-tag>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">待结转金额：</text>{{ formatFmsAmount(item.balance) }}
            </view>
            <view class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">已生成凭证：</text>{{ item.voucherIds?.length || 0 }} 张
            </view>
          </view>
        </view>
      </z-paging>
    </template>

    <!-- 无可用账套引导 -->
    <AccountSetGuide v-else-if="fmsStore.accountSetListLoaded" />
  </view>
</template>

<script lang="ts" setup>
import type { ClosingScheme } from '@/api/fms/closing/scheme'
import { getClosingSchemeList } from '@/api/fms/closing/scheme'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsClosingType } from '@/pages-fms/utils/constants'
import { formatFmsAmount } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const fmsStore = useFmsStore()
const list = ref<ClosingScheme[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询结账方案列表（账套当前期间的全量列表，不分页） */
async function queryList() {
  const accountSetId = fmsStore.accountSet?.id
  const month = fmsStore.currentMonth
  if (!accountSetId || !month) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getClosingSchemeList({ accountSetId, month })
    pagingRef.value?.complete(data)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
async function reload() {
  await fmsStore.loadCurrentMonth()
  pagingRef.value?.reload()
}

/** 查看结账模板列表 */
function handleTemplateList() {
  uni.navigateTo({ url: '/pages-fms/closing/template/index' })
}

/** 查看方案详情 */
function handleDetail(item: ClosingScheme) {
  uni.navigateTo({
    url: `/pages-fms/closing/scheme/detail/index?id=${item.id}&month=${fmsStore.currentMonth}`,
  })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await fmsStore.loadCurrentMonth()
})
</script>
