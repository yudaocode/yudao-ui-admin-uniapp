<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="币别"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="fmsStore.accountSet">
      <!-- 账套切换 -->
      <view class="p-24rpx pb-0">
        <AccountSetSwitch @change="reload" />
      </view>

      <!-- 币别列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :refresher-enabled="true"
        empty-view-text="暂无币别数据"
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
              <wd-tag v-if="item.standard" type="primary" plain>
                本位币
              </wd-tag>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">币别编码：</text>{{ item.code }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">汇率：</text>{{ formatFmsExchangeRate(item.exchangeRate) }}
            </view>
            <view class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">创建时间：</text>{{ formatDateTime(item.createTime) || '-' }}
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
    <AccountSetGuide />
  </view>
</template>

<script lang="ts" setup>
import type { Currency } from '@/api/fms/config/currency'
import { onUnload } from '@dcloudio/uni-app'
import { getCurrencyList } from '@/api/fms/config/currency'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { formatFmsExchangeRate } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const list = ref<Currency[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

const canCreate = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:currency:create'])) // 当前账套可写且有新增权限时才允许新增

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询币别列表（账套级全量列表，不分页） */
async function queryList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getCurrencyList(accountSetId)
    pagingRef.value?.complete(data)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增币别 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-fms/config/currency/form/index' })
}

/** 查看详情 */
function handleDetail(item: Currency) {
  uni.navigateTo({ url: `/pages-fms/config/currency/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  uni.$on('fms:config:currency:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:currency:reload', reload)
})
</script>
