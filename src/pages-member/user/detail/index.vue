<template>
  <view
    class="yd-page-container"
    :class="{
      'yd-page-container-paging': isPagingTab,
      'pb-[140rpx]': !isPagingTab,
    }"
  >
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="会员详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <template v-if="activeTab === 'basic'">
      <!-- 会员概览 -->
      <view class="bg-white p-24rpx">
        <view class="mb-24rpx flex items-center gap-20rpx">
          <wd-img
            v-if="formData?.avatar"
            :src="formData.avatar"
            :width="56"
            :height="56"
            mode="aspectFill"
            round
          />
          <view
            v-else
            class="h-112rpx w-112rpx flex items-center justify-center rounded-full bg-[#1890ff] text-40rpx text-white"
          >
            {{ (formData?.nickname || formData?.mobile || '会').charAt(0) }}
          </view>
          <view class="min-w-0 flex-1">
            <view class="truncate text-36rpx text-[#333] font-semibold">
              {{ formData?.nickname || formData?.name || '-' }}
            </view>
            <view class="mt-8rpx text-26rpx text-[#999]">
              {{ formData?.mobile || '未绑定手机号' }}
            </view>
          </view>
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
          <text v-else class="text-26rpx text-[#999]">-</text>
        </view>
        <view class="grid grid-cols-3 gap-12rpx rounded-8rpx bg-[#f7f8fa] p-16rpx text-center">
          <view>
            <view class="text-32rpx text-[#333] font-semibold">
              {{ formData?.point ?? 0 }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              当前积分
            </view>
          </view>
          <view>
            <view class="text-32rpx text-[#333] font-semibold">
              {{ formData?.totalPoint ?? 0 }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              总积分
            </view>
          </view>
          <view>
            <view class="text-32rpx text-[#333] font-semibold">
              {{ formData?.experience ?? 0 }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              成长值
            </view>
          </view>
          <view>
            <view class="break-all text-28rpx text-[#333] font-semibold">
              {{ formatAmount(walletData?.balance) }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              当前余额
            </view>
          </view>
          <view>
            <view class="break-all text-28rpx text-[#333] font-semibold">
              {{ formatAmount(walletData?.totalExpense) }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              支出金额
            </view>
          </view>
          <view>
            <view class="break-all text-28rpx text-[#333] font-semibold">
              {{ formatAmount(walletData?.totalRecharge) }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              充值金额
            </view>
          </view>
        </view>
      </view>

      <!-- 基础字段 -->
      <wd-cell-group border>
        <wd-cell title="真实姓名" :value="formData?.name || '-'" />
        <wd-cell title="邮箱" :value="formData?.email || '-'" />
        <wd-cell title="性别">
          <dict-tag v-if="formData?.sex != null" :type="DICT_TYPE.SYSTEM_USER_SEX" :value="formData?.sex" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="所在地" :value="formData?.areaName || '-'" />
        <wd-cell title="会员等级" :value="formData?.levelName || '-'" />
        <wd-cell title="用户分组" :value="formData?.groupName || '-'" />
        <wd-cell title="注册 IP" :value="formData?.registerIp || '-'" />
        <wd-cell title="最后登录 IP" :value="formData?.loginIp || '-'" />
        <wd-cell title="生日" :value="formatDate(formData?.birthday) || '-'" />
        <wd-cell title="注册时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="最后登录时间" :value="formatDateTime(formData?.loginDate) || '-'" />
        <wd-cell title="会员备注" :value="formData?.mark || '-'" />
      </wd-cell-group>
    </template>

    <!-- 明细列表 -->
    <PointList v-if="loadedTabs.has('point')" v-show="activeTab === 'point'" class="min-h-0 flex-1" :user-id="props.id" />
    <SignList v-if="loadedTabs.has('sign')" v-show="activeTab === 'sign'" class="min-h-0 flex-1" :user-id="props.id" />
    <ExperienceList v-if="loadedTabs.has('experience')" v-show="activeTab === 'experience'" class="min-h-0 flex-1" :user-id="props.id" />
    <BalanceList v-if="loadedTabs.has('balance')" v-show="activeTab === 'balance'" class="min-h-0 flex-1" :wallet-id="walletData?.id" />
    <AddressList v-if="loadedTabs.has('address')" v-show="activeTab === 'address'" :user-id="props.id" />
    <OrderList v-if="loadedTabs.has('order')" v-show="activeTab === 'order'" class="min-h-0 flex-1" :user-id="props.id" />
    <AfterSaleList v-if="loadedTabs.has('after-sale')" v-show="activeTab === 'after-sale'" class="min-h-0 flex-1" :user-id="props.id" />
    <FavoriteList v-if="loadedTabs.has('favorite')" v-show="activeTab === 'favorite'" class="min-h-0 flex-1" :user-id="props.id" />
    <CouponList v-if="loadedTabs.has('coupon')" v-show="activeTab === 'coupon'" class="min-h-0 flex-1" :user-id="props.id" />
    <BrokerageList v-if="loadedTabs.has('brokerage')" v-show="activeTab === 'brokerage'" class="min-h-0 flex-1" :bind-user-id="props.id" />

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['member:user:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasMoreActions"
          class="flex-1" type="info" @click="moreActionVisible = true"
        >
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />
    <!-- 修改等级弹窗 -->
    <LevelUpdateForm v-model="levelFormVisible" :user-id="props.id" @success="handleActionSuccess" />
    <!-- 修改积分弹窗 -->
    <PointUpdateForm v-model="pointFormVisible" :user-id="props.id" @success="handleActionSuccess" />
    <!-- 修改余额弹窗 -->
    <BalanceUpdateForm v-model="balanceFormVisible" :user-id="props.id" @success="handleActionSuccess" />
    <!-- 发送优惠券弹窗 -->
    <CouponSendForm v-model="couponSendVisible" :user-id="props.id" @success="handleActionSuccess" />
  </view>
</template>

<script lang="ts" setup>
import type { MemberUser } from '@/api/member/user'
import type { PayWallet } from '@/api/pay/wallet/balance'
import { onUnload } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { getMemberUser } from '@/api/member/user'
import { getPayWallet } from '@/api/pay/wallet/balance'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import AddressList from './components/address-list.vue'
import AfterSaleList from './components/after-sale-list.vue'
import BalanceList from './components/balance-list.vue'
import BalanceUpdateForm from './components/balance-update-form.vue'
import BrokerageList from './components/brokerage-list.vue'
import CouponList from './components/coupon-list.vue'
import CouponSendForm from './components/coupon-send-form.vue'
import ExperienceList from './components/experience-list.vue'
import FavoriteList from './components/favorite-list.vue'
import LevelUpdateForm from './components/level-update-form.vue'
import OrderList from './components/order-list.vue'
import PointList from './components/point-list.vue'
import PointUpdateForm from './components/point-update-form.vue'
import SignList from './components/sign-list.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabs: { key: string, title: string }[] = [ // 详情分类
  { key: 'basic', title: '基本信息' },
  { key: 'point', title: '积分' },
  { key: 'sign', title: '签到' },
  { key: 'experience', title: '成长值' },
  { key: 'balance', title: '余额' },
  { key: 'address', title: '收货地址' },
  { key: 'order', title: '订单管理' },
  { key: 'after-sale', title: '售后管理' },
  { key: 'favorite', title: '收藏记录' },
  { key: 'coupon', title: '优惠券' },
  { key: 'brokerage', title: '推广用户' },
]
const { hasAccessByCodes } = useAccess()
const toast = useToast()
const formData = ref<MemberUser>() // 详情数据
const walletData = ref<PayWallet>() // 钱包数据
const tabIndex = ref(0) // 当前详情分类下标
const loadedTabs = ref(new Set<string>(['basic'])) // 已加载过的分类；懒加载，避免打开详情即并发全部列表请求
const moreActionVisible = ref(false) // 更多操作菜单
const levelFormVisible = ref(false) // 修改等级弹窗
const pointFormVisible = ref(false) // 修改积分弹窗
const balanceFormVisible = ref(false) // 修改余额弹窗
const couponSendVisible = ref(false) // 发送优惠券弹窗
const activeTab = computed(() => tabs[tabIndex.value]?.key || 'basic') // 当前详情分类
const isPagingTab = computed(() => !['basic', 'address'].includes(activeTab.value)) // 分页详情分类使用固定高布局
const moreActions = computed(() => { // 更多操作菜单项
  const actions = []
  if (hasAccessByCodes(['member:user:update-level'])) {
    actions.push({ name: '修改等级', value: 'update-level' })
  }
  if (hasAccessByCodes(['member:user:update-point'])) {
    actions.push({ name: '修改积分', value: 'update-point' })
  }
  if (hasAccessByCodes(['pay:wallet:update-balance'])) {
    actions.push({ name: '修改余额', value: 'update-balance' })
  }
  if (hasAccessByCodes(['promotion:coupon:send'])) {
    actions.push({ name: '发送优惠券', value: 'send-coupon' })
  }
  return actions
})
const hasMoreActions = computed(() => moreActions.value.length > 0) // 是否显示更多操作

/** 切换详情分类时记录已加载分类，实现懒加载 */
watch(activeTab, value => loadedTabs.value.add(value))

/** 金额分转元展示 */
function formatAmount(value?: number | string) {
  return `￥${(Number(value || 0) / 100).toFixed(2)}`
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-member/user/index')
}

/** 加载会员详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    const userId = Number(props.id)
    const [user, wallet] = await Promise.all([
      getMemberUser(userId),
      getPayWallet({ userId }),
    ])
    formData.value = user
    walletData.value = wallet
  } finally {
    toast.close()
  }
}

/** 编辑会员 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-member/user/form/index?id=${props.id}`,
  })
}

/** 打开更多操作表单 */
function openMoreActionForm(value: string) {
  if (value === 'update-level') {
    levelFormVisible.value = true
  } else if (value === 'update-point') {
    pointFormVisible.value = true
  } else if (value === 'update-balance') {
    balanceFormVisible.value = true
  } else if (value === 'send-coupon') {
    couponSendVisible.value = true
  }
}

/** 更多操作 */
function handleMoreAction({ item }: { item: { value: string } }) {
  moreActionVisible.value = false
  nextTick(() => {
    setTimeout(() => openMoreActionForm(item.value), 220)
  })
}

/** 操作成功 */
function handleActionSuccess() {
  uni.$emit('member:user:reload')
}

/** 初始化 */
onMounted(() => {
  uni.$on('member:user:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('member:user:reload', getDetail)
})
</script>
