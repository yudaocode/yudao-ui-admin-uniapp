<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="收银台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 支付信息 -->
    <view class="p-24rpx">
      <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-20rpx text-32rpx text-[#333] font-semibold">
          支付信息
        </view>
        <view class="mb-12rpx flex text-28rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">支付单号：</text>
          <text>{{ payOrder.id || '-' }}</text>
        </view>
        <view class="mb-12rpx flex text-28rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">商品标题：</text>
          <text class="min-w-0 flex-1 break-all">{{ payOrder.subject || '-' }}</text>
        </view>
        <view class="mb-12rpx flex text-28rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">商品内容：</text>
          <text class="min-w-0 flex-1 break-all">{{ payOrder.body || '-' }}</text>
        </view>
        <view class="mb-12rpx flex text-28rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">支付金额：</text>
          <text class="text-[#fa8c16] font-semibold">{{ formatDisplayMoney(payOrder.price) }}</text>
        </view>
        <view class="mb-12rpx flex text-28rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">创建时间：</text>
          <text>{{ formatDateTime(payOrder.createTime) || '-' }}</text>
        </view>
        <view class="flex text-28rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">过期时间：</text>
          <text>{{ formatDateTime(payOrder.expireTime) || '-' }}</text>
        </view>
      </view>

      <!-- 支付渠道 -->
      <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-20rpx text-32rpx text-[#333] font-semibold">
          选择支付方式
        </view>

        <view
          v-for="group in channelGroups"
          :key="group.title"
          class="mb-24rpx last:mb-0"
        >
          <view class="mb-16rpx text-28rpx text-[#666]">
            {{ group.title }}
          </view>
          <view class="grid grid-cols-2 gap-16rpx">
            <wd-button
              v-for="channel in group.channels"
              :key="channel.code"
              type="primary" variant="plain"
              :loading="submitLoading && currentChannelCode === channel.code"
              @click="submit(channel.code)"
            >
              {{ channel.name }}
            </wd-button>
          </view>
        </view>
      </view>
    </view>

    <!-- 二维码结果弹窗 -->
    <wd-popup
      v-model="qrCode.visible"
      position="center"
      custom-style="width: 650rpx; border-radius: 16rpx;"
      @close="qrCode.visible = false"
    >
      <view class="p-32rpx">
        <view class="mb-20rpx text-center text-32rpx text-[#333] font-semibold">
          {{ qrCode.title }}
        </view>
        <view class="mb-24rpx break-all rounded-8rpx bg-[#f7f8fa] p-20rpx text-26rpx text-[#666]">
          {{ qrCode.url }}
        </view>
        <wd-button type="primary" block @click="copyText(qrCode.url)">
          复制支付内容
        </wd-button>
      </view>
    </wd-popup>

    <!-- 条码支付弹窗 -->
    <wd-popup
      v-model="barCode.visible"
      position="bottom"
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      safe-area-inset-bottom
    >
      <view class="p-32rpx">
        <view class="mb-24rpx flex items-center justify-between">
          <text class="text-32rpx text-[#333] font-semibold">{{ barCode.title }}</text>
          <wd-icon name="close" size="20px" @click="barCode.visible = false" />
        </view>
        <wd-input v-model="barCode.value" clearable placeholder="请输入条形码" />
        <view class="mt-32rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="barCode.visible = false">
            取消
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            :disabled="!barCode.value"
            :loading="submitLoading"
            @click="submit0(barCode.channelCode)"
          >
            确认支付
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<!-- suppress UnreachableCodeJS -->
<script lang="ts" setup>
import type { PayOrder } from '@/api/pay/order'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref } from 'vue'
import { getPayOrder, submitPayOrder } from '@/api/pay/order'
import { navigateBackPlus } from '@/utils'
import { PayChannelEnum, PayDisplayModeEnum, PayOrderStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatDisplayMoney } from '@/utils/format'

const props = defineProps<{
  id?: number | any
  returnUrl?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const payOrder = ref<PayOrder>({}) // 支付订单详情
const submitLoading = ref(false) // 支付提交状态
const currentChannelCode = ref('') // 当前提交渠道
const interval = ref<any>() // 支付结果轮询
const returnUrl = ref('') // 支付完成返回地址
const qrCode = ref({
  title: '',
  url: '',
  visible: false,
}) // 二维码支付结果
const barCode = ref({
  channelCode: '',
  value: '',
  title: '',
  visible: false,
}) // 条码支付表单
const channelGroups = [
  {
    title: '支付宝支付',
    channels: [
      { code: PayChannelEnum.ALIPAY_PC.code, name: 'PC 网站支付' },
      { code: PayChannelEnum.ALIPAY_WAP.code, name: 'WAP 网站支付' },
      { code: PayChannelEnum.ALIPAY_APP.code, name: 'APP 支付' },
      { code: PayChannelEnum.ALIPAY_QR.code, name: '扫码支付' },
      { code: PayChannelEnum.ALIPAY_BAR.code, name: '条码支付' },
    ],
  },
  {
    title: '微信支付',
    channels: [
      { code: PayChannelEnum.WX_PUB.code, name: '公众号支付' },
      { code: PayChannelEnum.WX_LITE.code, name: '小程序支付' },
      { code: PayChannelEnum.WX_APP.code, name: 'APP 支付' },
      { code: PayChannelEnum.WX_NATIVE.code, name: 'Native 支付' },
      { code: PayChannelEnum.WX_BAR.code, name: '条码支付' },
    ],
  },
  {
    title: '其它支付',
    channels: [
      { code: PayChannelEnum.WALLET.code, name: '钱包支付' },
      { code: PayChannelEnum.MOCK.code, name: '模拟支付' },
    ],
  },
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(returnUrl.value || '/pages-pay/demo/order/index')
}

/** 加载支付信息 */
async function getDetail() {
  if (!props.id) {
    toast.error('未传递支付单号，无法查看对应的支付信息')
    goReturnUrl('cancel')
    return
  }
  const data = await getPayOrder(Number(props.id), true)
  if (!data) {
    toast.error('支付订单不存在，请检查')
    goReturnUrl('cancel')
    return
  }
  if (data.status === PayOrderStatusEnum.SUCCESS.status) {
    toast.success('支付成功')
    goReturnUrl('success')
    return
  }
  if (data.status === PayOrderStatusEnum.CLOSED.status) {
    toast.error('无法支付，原因：订单已关闭')
    goReturnUrl('close')
    return
  }
  payOrder.value = data
}

/** 提交支付 */
function submit(channelCode: string) {
  if (channelCode === PayChannelEnum.ALIPAY_BAR.code) {
    barCode.value = {
      channelCode,
      value: '',
      title: '支付宝条码支付',
      visible: true,
    }
    return
  }
  if (channelCode === PayChannelEnum.WX_BAR.code) {
    barCode.value = {
      channelCode,
      value: '',
      title: '微信条码支付',
      visible: true,
    }
    return
  }
  if (channelCode === PayChannelEnum.WX_PUB.code) {
    toast.error('微信公众号支付：当前 H5 管理端不支持')
    return
  }
  if (channelCode === PayChannelEnum.WX_LITE.code) {
    toast.error('微信小程序支付：当前 H5 管理端不支持')
    return
  }
  submit0(channelCode)
}

/** 执行支付提交 */
async function submit0(channelCode: string) {
  submitLoading.value = true
  currentChannelCode.value = channelCode
  try {
    const data = await submitPayOrder({
      id: Number(props.id),
      channelCode,
      returnUrl: getCurrentUrl(),
      ...buildSubmitParam(channelCode),
    })
    if (data.status === PayOrderStatusEnum.SUCCESS.status) {
      clearQueryInterval()
      toast.success('支付成功')
      goReturnUrl('success')
      return
    }
    if (data.displayMode === PayDisplayModeEnum.URL.mode) {
      displayUrl(data.displayContent)
    } else if (data.displayMode === PayDisplayModeEnum.QR_CODE.mode) {
      displayQrCode(channelCode, data.displayContent)
    } else if (data.displayMode === PayDisplayModeEnum.APP.mode) {
      displayApp(channelCode)
    }
    createQueryInterval()
  } finally {
    submitLoading.value = false
    currentChannelCode.value = ''
  }
}

/** 构造支付扩展参数 */
function buildSubmitParam(channelCode: string) {
  if (channelCode === PayChannelEnum.ALIPAY_BAR.code) {
    return {
      channelExtras: {
        auth_code: barCode.value.value,
      },
    }
  }
  if (channelCode === PayChannelEnum.WX_BAR.code) {
    return {
      channelExtras: {
        authCode: barCode.value.value,
      },
    }
  }
  return {}
}

/** URL 支付结果 */
function displayUrl(url?: string) {
  if (!url) {
    return
  }
  // #ifdef H5
  window.location.href = url
  // #endif
  // #ifndef H5
  copyText(url)
  // #endif
}

/** 二维码支付结果 */
function displayQrCode(channelCode: string, url?: string) {
  let title = '请复制支付内容后继续支付'
  if (channelCode === PayChannelEnum.ALIPAY_WAP.code) {
    title = '请用手机浏览器继续支付'
  } else if (channelCode.startsWith('alipay_')) {
    title = '请使用支付宝扫码支付'
  } else if (channelCode.startsWith('wx_')) {
    title = '请使用微信扫码支付'
  }
  qrCode.value = {
    title,
    url: url || '',
    visible: true,
  }
}

/** APP 支付结果 */
function displayApp(channelCode: string) {
  if (channelCode === PayChannelEnum.ALIPAY_APP.code) {
    toast.error('支付宝 APP 支付：无法在网页支付')
  }
  if (channelCode === PayChannelEnum.WX_APP.code) {
    toast.error('微信 APP 支付：无法在网页支付')
  }
}

/** 创建轮询任务 */
function createQueryInterval() {
  if (interval.value || !props.id) {
    return
  }
  interval.value = setInterval(async () => {
    const data = await getPayOrder(Number(props.id))
    if (data.status === PayOrderStatusEnum.SUCCESS.status) {
      clearQueryInterval()
      toast.success('支付成功')
      goReturnUrl('success')
    }
    if (data.status === PayOrderStatusEnum.CLOSED.status) {
      clearQueryInterval()
      toast.error('支付已关闭')
      goReturnUrl('close')
    }
  }, 2000)
}

/** 清理轮询任务 */
function clearQueryInterval() {
  qrCode.value = {
    title: '',
    url: '',
    visible: false,
  }
  if (interval.value) {
    clearInterval(interval.value)
    interval.value = undefined
  }
}

/** 复制文本 */
function copyText(text?: string) {
  if (!text) {
    return
  }
  uni.setClipboardData({
    data: text,
  })
}

/** 获取当前地址 */
function getCurrentUrl() {
  // #ifdef H5
  return window.location.href
  // #endif
  // #ifndef H5
  return ''
  // #endif
}

/** 返回业务页面 */
function goReturnUrl(payResult: string) {
  clearQueryInterval()
  if (!returnUrl.value) {
    return
  }
  const url = returnUrl.value.includes('?')
    ? `${returnUrl.value}&payResult=${payResult}`
    : `${returnUrl.value}?payResult=${payResult}`
  if (returnUrl.value.startsWith('http')) {
    // #ifdef H5
    window.location.href = url
    // #endif
    return
  }
  uni.redirectTo({
    url,
    fail: () => {
      uni.navigateTo({ url })
    },
  })
}

/** 初始化 */
onMounted(() => {
  returnUrl.value = props.returnUrl ? decodeURIComponent(props.returnUrl) : ''
  getDetail()
})

/** 卸载 */
onUnmounted(() => {
  clearQueryInterval()
})
</script>
