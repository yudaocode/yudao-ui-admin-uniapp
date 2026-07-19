<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { onMounted, onUnmounted } from 'vue'
import { navigateToInterceptor } from '@/router/interceptor'
import { useDictStore, useTokenStore } from '@/store'
import { tabbarStore } from '@/tabbar/store'
import { currRoute } from '@/utils'

onLaunch((options) => {
  console.log('App.vue onLaunch', options)
})
onShow((options) => {
  console.log('App.vue onShow', options)

  // 微信环境可能清理本地缓存，导致登录态仍在但字典缓存丢失，这里做一次非阻塞补偿加载
  // 对应 https://t.zsxq.com/boU4A 帖子
  const tokenStore = useTokenStore()
  const dictStore = useDictStore()
  if (tokenStore.updateNowTime().hasLogin && !dictStore.isLoaded) {
    void dictStore.loadDictCacheWithRetry()
  }

  // 直接进入时使用启动路径；从文件、地图等系统页面返回时保留当前页面
  // https://github.com/unibest-tech/unibest/issues/192
  // https://gitee.com/yudaocode/yudao-ui-admin-uniapp/issues/IK1L9Q
  const currentRoute = currRoute()
  const path = options?.path || currentRoute.path
  if (!path) {
    return
  }
  const url = path.startsWith('/') ? path : `/${path}`
  navigateToInterceptor.invoke({
    url,
    query: options?.path ? options.query : currentRoute.query,
  })
  tabbarStore.syncCurIdxByCurrentPageAsync()
})
onHide(() => {
  console.log('App Hide')
})

// #ifdef H5
function syncTabbarWhenPageVisible() {
  if (document.visibilityState === 'visible') {
    tabbarStore.syncCurIdxByCurrentPageAsync()
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.addEventListener('pageshow', syncTabbarWhenPageVisible)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.removeEventListener('pageshow', syncTabbarWhenPageVisible)
})
// #endif
</script>

<style lang="scss">

</style>
