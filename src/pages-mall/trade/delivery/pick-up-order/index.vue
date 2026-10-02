<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="核销订单"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm :stores="pickUpStoreList" :default-store-id="pickUpStoreList[0]?.id" @search="handleQuery" @reset="handleReset" />

    <!-- 核销码核销入口 -->
    <view v-if="hasAccessByCodes(['trade:order:pick-up'])" class="px-24rpx pt-24rpx">
      <wd-button block type="success" @click="openVerifyPopup">
        核销码核销
      </wd-button>
    </view>

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无核销订单数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.no || '-' }}
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="item.status" />
          </view>

          <view class="flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">实付金额：</text>
            <text class="text-[#fa8c16] font-semibold">{{ formatDisplayMoney(item.payPrice) }}</text>
          </view>
          <view class="mt-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">核销码：</text>
            <text class="truncate">{{ item.pickUpVerifyCode || '-' }}</text>
          </view>
          <view class="mt-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 核销码核销弹窗 -->
    <wd-popup
      v-model="verifyVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="closeVerifyPopup"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          核销码核销
        </view>
        <!-- 录入态：输入核销码查订单 -->
        <template v-if="!verifyOrder">
          <wd-input v-model="verifyCode" clearable placeholder="请输入核销码" />
          <view class="mt-24rpx flex gap-20rpx">
            <wd-button class="flex-1" variant="plain" @click="closeVerifyPopup">
              取消
            </wd-button>
            <wd-button class="flex-1" type="primary" :loading="verifyQuerying" @click="handleQueryVerify">
              查询订单
            </wd-button>
          </view>
        </template>
        <!-- 确认态：展示查到的订单，二次确认后核销 -->
        <template v-else>
          <wd-cell-group border>
            <wd-cell title="订单号" :value="verifyOrder.no || '-'" />
            <wd-cell title="实付金额" :value="formatDisplayMoney(verifyOrder.payPrice)" />
            <wd-cell title="下单时间" :value="formatDateTime(verifyOrder.createTime) || '-'" />
          </wd-cell-group>
          <view class="mt-24rpx flex gap-20rpx">
            <wd-button class="flex-1" variant="plain" @click="verifyOrder = undefined">
              重新输入
            </wd-button>
            <wd-button class="flex-1" type="primary" :loading="verifySubmitting" @click="handleVerify">
              确认核销
            </wd-button>
          </view>
        </template>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { TradeOrder } from '@/api/mall/trade/order'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import type { DeliveryPickUpStore } from '@/api/mall/trade/delivery/pick-up-store'
import { getSimpleDeliveryPickUpStoreList } from '@/api/mall/trade/delivery/pick-up-store'
import { useUserStore } from '@/store/user'
import { getDeliveryPickUpOrderPage } from '@/api/mall/trade/delivery/pick-up-order'
import { getTradeOrderByPickUpVerifyCode, pickUpTradeOrderByVerifyCode } from '@/api/mall/trade/order'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { hasAccessByCodes } = useAccess()

const list = ref<TradeOrder[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const pickUpStoreList = ref<DeliveryPickUpStore[]>([]) // 当前用户可核销的门店
const userStore = useUserStore()
const queryParams = ref<Record<string, any>>({}) // 查询参数
const verifyVisible = ref(false) // 核销码弹窗显示状态
const verifyCode = ref('') // 核销码
const verifyOrder = ref<TradeOrder>() // 按核销码查到的订单（确认态展示）
const verifyQuerying = ref(false) // 查询订单状态
const verifySubmitting = ref(false) // 核销提交状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询核销订单列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const stores = await getSimpleDeliveryPickUpStoreList()
    const userId = userStore.userInfo.id
    pickUpStoreList.value = stores.filter(item => item.verifyUserIds?.includes(userId))
    if (pickUpStoreList.value.length === 0) {
      pagingRef.value?.completeByTotal([], 0)
      toast.warning('当前登录人没绑定任何自提点')
      return
    }
    const storeId = queryParams.value.pickUpStoreIds?.[0] ?? pickUpStoreList.value[0].id
    if (!pickUpStoreList.value.some(store => store.id === storeId)) {
      pagingRef.value?.completeByTotal([], 0)
      toast.warning('无权核销该自提门店')
      return
    }
    const data = await getDeliveryPickUpOrderPage({ ...queryParams.value, pickUpStoreIds: [storeId], pageNo, pageSize })
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

/** 查看详情：复用订单详情页（其底部即支持自提核销） */
function handleDetail(item: TradeOrder) {
  if (item.id == null) {
    return
  }
  uni.navigateTo({ url: `/pages-mall/trade/order/detail/index?id=${item.id}` })
}

/** 打开核销码弹窗 */
function openVerifyPopup() {
  verifyCode.value = ''
  verifyOrder.value = undefined
  verifyVisible.value = true
}

/** 关闭核销码弹窗 */
function closeVerifyPopup() {
  verifyVisible.value = false
  verifyCode.value = ''
  verifyOrder.value = undefined
}

/** 第一步：按核销码查订单，进入确认态 */
async function handleQueryVerify() {
  if (!verifyCode.value) {
    toast.error('请输入核销码')
    return
  }
  verifyQuerying.value = true
  try {
    const order = await getTradeOrderByPickUpVerifyCode(verifyCode.value)
    if (!order?.id) {
      toast.error('未找到该核销码对应的订单')
      return
    }
    verifyOrder.value = order
  } finally {
    verifyQuerying.value = false
  }
}

/** 第二步：确认订单信息后核销 */
async function handleVerify() {
  verifySubmitting.value = true
  try {
    await pickUpTradeOrderByVerifyCode(verifyCode.value)
    toast.success('核销成功')
    closeVerifyPopup()
    uni.$emit('mall:trade-order:reload')
  } finally {
    verifySubmitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mall:trade-order:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:trade-order:reload', reload)
})
</script>
