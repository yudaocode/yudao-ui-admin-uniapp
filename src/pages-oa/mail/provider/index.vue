<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="邮箱服务配置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 服务配置列表 -->
    <view class="min-h-0 flex-1 overflow-auto p-24rpx">
      <view v-if="!list.length" class="py-120rpx text-center text-28rpx text-[#999]">
        暂无服务配置
      </view>
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="mb-8rpx flex items-center justify-between gap-12rpx">
          <text class="line-clamp-1 min-w-0 flex-1 text-30rpx text-[#333] font-semibold">{{ item.name }}</text>
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
        </view>
        <view class="mb-4rpx text-24rpx text-[#999]">
          收信：{{ item.imap.host }}:{{ item.imap.port }}{{ item.imap.sslEnable ? '（SSL）' : '' }}
        </view>
        <view class="text-24rpx text-[#999]">
          发信：{{ item.smtp.host }}:{{ item.smtp.port }}{{ item.smtp.sslEnable ? '（SSL）' : '' }}
        </view>
      </view>
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['oa:mail-provider:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MailProvider } from '@/api/oa/mail'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getMailProviderList } from '@/api/oa/mail'
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
const list = ref<MailProvider[]>([]) // 服务配置列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询服务配置列表 */
async function getList() {
  list.value = await getMailProviderList()
}

/** 新增服务配置 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/mail/provider/form/index',
  })
}

/** 查看服务配置详情 */
function handleDetail(item: MailProvider) {
  uni.navigateTo({
    url: `/pages-oa/mail/provider/detail/index?id=${item.id}`,
  })
}

/** 初始化与返回刷新 */
onShow(() => {
  getList()
})
</script>
