<template>
  <view
    class="rounded-12rpx bg-[linear-gradient(135deg,#13c2c2,#36cfc9)] p-24rpx text-white"
    @click="handleGo('/pages-oa/contact/index')"
  >
    <view v-if="loadError" class="py-24rpx text-center text-26rpx" @click.stop="loadData">
      我的联系人加载失败，点击重试
    </view>
    <template v-else>
      <view class="mb-8rpx text-26rpx opacity-90">
        我的联系人
      </view>
      <view class="truncate text-36rpx font-semibold">
        {{ contactTotal }}
      </view>
      <view class="mt-4rpx truncate text-22rpx opacity-85">
        我维护的联系人总数
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getMyContactPage } from '@/api/oa/contact'

const loadError = ref(false) // 加载失败时显示重试入口
const loading = ref(false) // 防止重复加载

const contactTotal = ref(0) // 我的联系人总数

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 加载面板数据，失败不展示为零值或空列表 */
async function loadData() {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    contactTotal.value = (await getMyContactPage({ pageNo: 1, pageSize: 1 })).total
    loadError.value = false
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(loadData)
</script>
