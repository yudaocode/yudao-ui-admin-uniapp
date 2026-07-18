<template>
  <RtcCallContainer ref="containerRef" @ended="handleEnded" />
</template>

<script lang="ts" setup>
import { onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'
import RtcCallContainer from './components/rtc-call-container.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const containerRef = ref<InstanceType<typeof RtcCallContainer>>() // 通话容器引用
let leaving = false
const RTC_CALL_ROUTE = 'pages-im/home/conversation/rtc/call/index' // 通话页路由
const RTC_FALLBACK_URL = '/pages-im/home/conversation/index' // 通话页兜底返回地址

/** 通话结束后离开页面 */
function handleEnded() {
  if (leaving) {
    return
  }
  leaving = true
  const pages = getCurrentPages()
  const previousPage = pages[pages.length - 2]
  if (previousPage?.route && previousPage.route !== RTC_CALL_ROUTE) {
    uni.navigateBack()
    return
  }
  uni.reLaunch({ url: RTC_FALLBACK_URL })
}

/** 系统返回或侧滑退出时兜底结束通话 */
onUnload(() => {
  leaving = true
  void containerRef.value?.teardown()
})
</script>
