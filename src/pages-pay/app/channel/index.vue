<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="支付渠道配置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 渠道列表 -->
    <view class="p-24rpx">
      <view
        v-for="group in channelGroups"
        :key="group.title"
        class="mb-32rpx"
      >
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          {{ group.title }}
        </view>
        <view
          v-for="channel in group.channels"
          :key="channel.code"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="text-30rpx text-[#333] font-semibold">
                {{ channel.name }}
              </view>
              <view class="mt-6rpx text-24rpx text-[#999]">
                {{ channel.code }}
              </view>
            </view>
            <dict-tag
              v-if="getChannel(channel.code)?.id"
              :type="DICT_TYPE.COMMON_STATUS"
              :value="getChannel(channel.code)?.status"
            />
            <wd-tag v-else type="warning">
              未配置
            </wd-tag>
          </view>
          <view class="flex items-center justify-between">
            <view class="flex text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">渠道费率：</text>
              <text>{{ getChannel(channel.code)?.feeRate ?? 0 }}%</text>
            </view>
            <wd-button
              v-if="hasAccessByCodes([getChannel(channel.code)?.id ? 'pay:channel:update' : 'pay:channel:create'])"
              size="small"
              type="primary"
              @click="handleConfig(channel.code)"
            >
              {{ getChannel(channel.code)?.id ? '编辑配置' : '新增配置' }}
            </wd-button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PayChannel } from '@/api/pay/channel'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getPayChannelList } from '@/api/pay/channel'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, PayChannelEnum } from '@/utils/constants'

const props = defineProps<{
  appId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<PayChannel[]>([]) // 渠道列表
const channelGroups = [
  {
    title: '支付宝支付',
    channels: [
      PayChannelEnum.ALIPAY_PC,
      PayChannelEnum.ALIPAY_WAP,
      PayChannelEnum.ALIPAY_APP,
      PayChannelEnum.ALIPAY_QR,
      PayChannelEnum.ALIPAY_BAR,
    ],
  },
  {
    title: '微信支付',
    channels: [
      PayChannelEnum.WX_PUB,
      PayChannelEnum.WX_LITE,
      PayChannelEnum.WX_APP,
      PayChannelEnum.WX_NATIVE,
      PayChannelEnum.WX_WAP,
      PayChannelEnum.WX_BAR,
    ],
  },
  {
    title: '其它支付',
    channels: [
      PayChannelEnum.WALLET,
      PayChannelEnum.MOCK,
    ],
  },
]
const channelMap = computed(() => {
  return list.value.reduce<Record<string, PayChannel>>((map, item) => {
    if (item.code) {
      map[item.code] = item
    }
    return map
  }, {})
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pay/app/index')
}

/** 获取渠道配置 */
function getChannel(code: string) {
  return channelMap.value[code]
}

/** 编辑渠道配置 */
function handleConfig(code: string) {
  if (!props.appId || !hasAccessByCodes(['pay:channel:query'])) {
    return
  }
  uni.navigateTo({
    url: `/pages-pay/app/channel/form/index?appId=${props.appId}&code=${code}`,
  })
}

/** 加载渠道列表 */
async function loadChannels() {
  if (!props.appId || !hasAccessByCodes(['pay:channel:query'])) {
    return
  }
  list.value = await getPayChannelList(Number(props.appId)) || []
}

/** 初始化 */
onMounted(() => {
  uni.$on('pay-channel:reload', loadChannels)
  loadChannels()
})

/** 卸载 */
onUnload(() => {
  uni.$off('pay-channel:reload', loadChannels)
})
</script>
