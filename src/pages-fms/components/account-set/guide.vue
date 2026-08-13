<template>
  <!-- 无可用账套引导：进入 FMS 页面时自动弹出，对齐 PC 弹窗形态 -->
  <wd-popup
    :model-value="visible"
    custom-style="border-radius: 24rpx;"
    :close-on-click-modal="false"
  >
    <view class="w-600rpx flex flex-col items-center px-48rpx py-56rpx">
      <view class="text-34rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <view class="mt-24rpx text-center text-28rpx text-[#666] leading-44rpx">
        {{ description }}
      </view>
      <view class="mt-48rpx w-full flex flex-col gap-24rpx">
        <wd-button v-if="canHandle" block type="primary" @click="goAccountSet">
          前往账套管理
        </wd-button>
        <wd-button block variant="plain" @click="handleBack">
          {{ canHandle ? '稍后处理' : '我知道了' }}
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { navigateBackPlus } from '@/utils'

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()

/** 弹窗可见：账套列表已加载且无可用账套 */
const visible = computed(() => fmsStore.accountSetListLoaded && !fmsStore.accountSet)
const reason = computed(() => (fmsStore.accountSetList.length === 0 ? 'empty' : 'uninitialized')) // 引导原因：无账套 / 账套未初始化
const canHandle = computed(() => // 当前用户是否可以自行处理账套问题
  reason.value === 'empty'
    ? hasAccessByCodes(['fms:config:account-set:create'])
    : hasAccessByCodes(['fms:config:account-set:initialize']),
)
const title = computed(() => (reason.value === 'empty' ? '当前账号暂无账套' : '当前账套尚未初始化')) // 引导标题
const description = computed(() => { // 引导说明
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

/** 稍后处理：返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>
