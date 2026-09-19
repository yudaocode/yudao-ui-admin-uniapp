<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我的邮箱账号"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 账号列表 -->
    <view class="min-h-0 flex-1 overflow-auto p-24rpx">
      <view v-if="!list.length" class="py-120rpx text-center text-28rpx text-[#999]">
        暂无邮箱账号，请点击右下角绑定
      </view>
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="mb-8rpx flex items-center justify-between gap-12rpx">
          <view class="min-w-0 flex flex-1 items-center gap-12rpx">
            <text class="line-clamp-1 text-30rpx text-[#333] font-semibold">{{ item.mail }}</text>
            <wd-tag v-if="item.defaultStatus" type="primary" plain>
              默认
            </wd-tag>
          </view>
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
        </view>
        <view class="text-24rpx text-[#999]">
          {{ providerNameMap.get(item.providerId || 0) || '未知服务' }} · 登录名 {{ item.username }}
        </view>
      </view>
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['oa:mail-account:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MailAccount } from '@/api/oa/mail'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getMailAccountList, getSimpleMailProviderList } from '@/api/oa/mail'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<MailAccount[]>([]) // 账号列表
const providerNameMap = ref(new Map<number, string>()) // 服务配置名称映射

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询账号列表 */
async function getList() {
  const [accounts, providers] = await Promise.all([
    getMailAccountList(),
    getSimpleMailProviderList(),
  ])
  list.value = accounts
  providerNameMap.value = new Map(providers.map(item => [item.id!, item.name]))
}

/** 绑定账号 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/mail/account/form/index',
  })
}

/** 查看邮箱账号详情 */
function handleDetail(item: MailAccount) {
  uni.navigateTo({
    url: `/pages-oa/mail/account/detail/index?id=${item.id}`,
  })
}

/** 初始化与返回刷新 */
onShow(() => {
  getList()
})
</script>
