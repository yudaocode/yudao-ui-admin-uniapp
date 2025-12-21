<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="地区管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 地区树列表 -->
    <view class="p-24rpx">
      <!-- 加载中 -->
      <view v-if="loading" class="py-100rpx text-center">
        <wd-loading />
      </view>
      <!-- 地区树 -->
      <view v-else-if="areaList.length > 0">
        <AreaTreeItem
          v-for="item in areaList"
          :key="item.id"
          :item="item"
        />
      </view>
      <!-- 空状态 -->
      <view v-else class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无地区数据" />
      </view>
    </view>

    <!-- 搜索按钮 -->
    <wd-fab
      position="right-bottom"
      type="primary"
      :expandable="false"
      icon="search"
      @click="handleOpenIpQuery"
    />

    <!-- IP 查询弹窗 -->
    <IpQueryForm v-model="showIpQuery" />
  </view>
</template>

<script lang="ts" setup>
import type { Area } from '@/api/system/area'
import { ref } from 'vue'
import { getAreaTree } from '@/api/system/area'
import { navigateBackPlus } from '@/utils'
import AreaTreeItem from './components/area-tree-item.vue'
import IpQueryForm from './components/ip-query-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const loading = ref(false)
const areaList = ref<Area[]>([])

const showIpQuery = ref(false) // 是否显示 IP 查询弹窗

/** 获取地区树 */
async function getList() {
  loading.value = true
  try {
    areaList.value = await getAreaTree()
  } finally {
    loading.value = false
  }
}

/** 打开 IP 查询弹窗 */
function handleOpenIpQuery() {
  showIpQuery.value = true
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
</style>
