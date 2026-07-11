<template>
  <!-- 收货地址列表 -->
  <view class="p-24rpx">
    <view
      v-for="item in list"
      :key="item.id"
      class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <view class="mb-16rpx flex items-center justify-between">
        <view class="text-30rpx text-[#333] font-semibold">
          {{ item.name || '-' }}
        </view>
        <wd-tag v-if="item.defaultStatus" type="primary" variant="plain">
          默认
        </wd-tag>
      </view>
      <view class="mb-12rpx text-28rpx text-[#666]">
        {{ item.mobile || '-' }}
      </view>
      <view class="mb-12rpx text-26rpx text-[#666]">
        {{ item.areaName || '-' }} {{ item.detailAddress || '' }}
      </view>
      <view class="text-24rpx text-[#999]">
        {{ formatDateTime(item.createTime) || '-' }}
      </view>
    </view>
    <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无收货地址" />
  </view>
</template>

<script lang="ts" setup>
import type { MemberAddress } from '@/api/member/address'
import { onMounted, ref, watch } from 'vue'
import { getMemberAddressList } from '@/api/member/address'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  userId?: number | any
}>()

const list = ref<MemberAddress[]>([]) // 列表数据
const loading = ref(false) // 加载状态

/** 查询收货地址 */
async function getList() {
  if (!props.userId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getMemberAddressList({ userId: Number(props.userId) })
  } finally {
    loading.value = false
  }
}

/** 监听会员变化，重新加载列表 */
watch(
  () => props.userId,
  () => {
    getList()
  },
)

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
