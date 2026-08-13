<template>
  <!-- 无可用账套引导：提示创建账套或完成初始化 -->
  <view class="flex flex-1 flex-col items-center justify-center px-48rpx py-96rpx">
    <view class="text-36rpx text-[#333] font-semibold">
      {{ title }}
    </view>
    <view class="mt-24rpx text-center text-28rpx text-[#666] leading-44rpx">
      {{ description }}
    </view>
    <view class="mt-48rpx w-full">
      <wd-button v-if="canHandle" block type="primary" @click="goAccountSet">
        前往账套管理
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()

/** 引导原因：无账套 / 账套未初始化 */
const reason = computed(() => (fmsStore.accountSetList.length === 0 ? 'empty' : 'uninitialized'))
/** 当前用户是否可以自行处理账套问题 */
const canHandle = computed(() =>
  reason.value === 'empty'
    ? hasAccessByCodes(['fms:config:account-set:create'])
    : hasAccessByCodes(['fms:config:account-set:initialize']),
)
/** 引导标题 */
const title = computed(() => (reason.value === 'empty' ? '当前账号暂无账套' : '当前账套尚未初始化'))
/** 引导说明 */
const description = computed(() => {
  if (reason.value === 'empty') {
    return canHandle.value
      ? '请先创建账套并完成初始化，再进入财务管理。'
      : '请联系管理员创建账套，或将当前账号加入已有账套。'
  }
  return canHandle.value
    ? '请前往账套管理，选择账套并点击【开始记账】完成初始化。'
    : '请联系管理员完成账套初始化后再进入财务管理。'
})

/** 前往账套管理处理 */
function goAccountSet() {
  uni.navigateTo({ url: '/pages-fms/config/account-set/index' })
}
</script>
