<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="数据流转" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 数据流转入口 -->
    <view v-if="entryList.length > 1" class="p-24rpx">
      <view
        v-for="item in entryList"
        :key="item.key"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="handleEntry(item.url)"
      >
        <view class="mb-12rpx text-32rpx text-[#333] font-semibold">
          {{ item.title }}
        </view>
        <view class="text-26rpx text-[#666]">
          {{ item.description }}
        </view>
      </view>
    </view>

    <!-- 无权限空状态 -->
    <view v-else-if="entryList.length === 0" class="flex flex-1 items-center justify-center">
      <wd-empty icon="content" tip="暂无数据流转权限" />
    </view>

    <!-- 加载状态 -->
    <view v-else class="flex flex-1 items-center justify-center">
      <wd-loading />
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const entryList = computed(() => { // 数据流转入口；双权限展示入口，单权限自动跳转
  const items: Array<{ key: string, title: string, description: string, url: string }> = []
  if (hasAccessByCodes(['iot:data-sink:query'])) {
    items.push({
      key: 'sink',
      title: '数据目的',
      description: '维护 TDengine、MQTT、HTTP 等数据流转目的',
      url: '/pages-iot/rule/data/sink/index',
    })
  }
  if (hasAccessByCodes(['iot:data-rule:query'])) {
    items.push({
      key: 'rule',
      title: '数据规则',
      description: '配置设备消息的数据流转规则',
      url: '/pages-iot/rule/data/rule/index',
    })
  }
  return items
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 进入数据流转功能 */
function handleEntry(url: string) {
  uni.redirectTo({ url })
}

/** 初始化 */
onMounted(() => {
  if (entryList.value.length === 1) {
    handleEntry(entryList.value[0].url)
  }
})
</script>
