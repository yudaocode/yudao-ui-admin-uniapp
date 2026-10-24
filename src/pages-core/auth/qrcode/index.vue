<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { confirmQrcode } from '@/api/login'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{ qrcodeId: string }>()

definePage({
  style: {
    navigationBarTitleText: '扫码登录',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const loading = ref(false) // 确认请求中
const confirmed = ref(false) // 手机已确认
const valid = computed(() => /^[a-f0-9]{32}$/.test(props.qrcodeId || '')) // 本系统二维码编号

/** 用户点击后才授权电脑登录 */
async function handleConfirm() {
  if (!valid.value || loading.value || confirmed.value) {
    return
  }
  loading.value = true
  try {
    await confirmQrcode(props.qrcodeId)
    confirmed.value = true
    toast.success('已确认，请回电脑查看')
  } finally {
    loading.value = false
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>

<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="扫码登录" left-arrow placeholder safe-area-inset-top @click-left="handleBack" />
    <!-- 确认区域 -->
    <view class="flex flex-col items-center px-48rpx pt-120rpx text-center">
      <wd-icon name="desktop" size="120rpx" color="#1890ff" />
      <text class="mt-48rpx text-36rpx font-medium">
        {{ confirmed ? '已确认登录' : '确认登录管理后台' }}
      </text>
      <text class="mt-24rpx text-28rpx text-[#666]">
        {{ !valid ? '二维码无效，请重新扫码' : confirmed ? '请回电脑查看；如已过期请重新扫码' : '请确认这是您正在使用的电脑，仅确认您本人发起的登录' }}
      </text>
      <wd-button
        v-if="!confirmed && valid" class="mt-64rpx w-full" :loading="loading"
        @click="handleConfirm"
      >
        确认登录
      </wd-button>
      <wd-button class="mt-24rpx w-full" type="info" @click="handleBack">
        {{ confirmed ? '完成' : '取消' }}
      </wd-button>
    </view>
  </view>
</template>
