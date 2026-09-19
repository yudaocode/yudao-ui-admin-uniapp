<template>
  <view
    class="rounded-12rpx bg-[linear-gradient(135deg,#13c2c2,#36cfc9)] p-24rpx text-white"
    @click="handleGo('/pages-oa/contact/index')"
  >
    <view class="mb-8rpx text-26rpx opacity-90">
      我的联系人
    </view>
    <view class="truncate text-36rpx font-semibold">
      {{ contactTotal }}
    </view>
    <view class="mt-4rpx truncate text-22rpx opacity-85">
      我维护的联系人总数
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getMyContactPage } from '@/api/oa/contact'

const contactTotal = ref(0) // 我的联系人总数

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 初始化 */
onMounted(() => {
  getMyContactPage({ pageNo: 1, pageSize: 1 }).then((data) => {
    contactTotal.value = data.total
  })
})
</script>
