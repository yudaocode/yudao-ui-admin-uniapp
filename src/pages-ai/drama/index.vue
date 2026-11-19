<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 短剧制作"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="我的项目" />
        <wd-tab title="公开广场" />
      </wd-tabs>
    </view>

    <!-- 我的项目 / 公开广场 -->
    <MyList v-if="tabIndex === 0" ref="myListRef" />
    <PublicList v-else @detail="openDetail" />

    <!-- 公开项目详情 -->
    <PublicDetailPopup ref="detailRef" />

    <!-- 新增按钮 -->
    <wd-fab
      v-if="tabIndex === 0"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { DramaPublic } from '@/api/ai/drama/project'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import MyList from './components/my-list.vue'
import PublicDetailPopup from './components/public-detail-popup.vue'
import PublicList from './components/public-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabIndex = ref(0) // 当前 Tab：0 我的项目、1 公开广场
const myListRef = ref<InstanceType<typeof MyList>>() // 我的项目列表引用
const detailRef = ref<InstanceType<typeof PublicDetailPopup>>() // 公开项目详情弹窗引用
let shown = false // 是否已显示过：首次显示由列表自行加载

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 新建项目 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-ai/drama/project/index' })
}

/** 查看公开项目详情 */
function openDetail(item: DramaPublic) {
  detailRef.value?.open(item.id)
}

/** 从项目页返回后刷新我的项目 */
onShow(() => {
  if (shown) {
    myListRef.value?.reload()
  }
  shown = true
})
</script>
