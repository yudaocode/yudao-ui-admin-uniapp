<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="员工端开通引导"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view v-if="visible" class="flex flex-1 flex-col items-center justify-center px-48rpx">
      <view class="text-36rpx text-[#333] font-semibold">
        当前账号尚未开通员工端
      </view>
      <view class="mt-24rpx text-center text-28rpx text-[#666] leading-44rpx">
        {{ description }}
      </view>

      <view class="mt-48rpx w-full overflow-hidden rounded-12rpx bg-white p-32rpx shadow-sm">
        <view class="mb-24rpx text-center text-30rpx text-[#333] font-semibold">
          完成员工端开通
        </view>
        <view class="text-26rpx text-[#666] leading-40rpx space-y-20rpx">
          <view>1. 进入员工档案</view>
          <view>2. 新增并绑定当前后台账号</view>
          <view>3. 保存员工档案后即可进入员工端</view>
        </view>
      </view>

      <view class="mt-48rpx w-full flex flex-col gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['hrm:employee:create'])"
          block
          type="primary"
          @click="goEmployee"
        >
          前往员工档案
        </wd-button>
        <wd-button block variant="plain" @click="handleBack">
          返回
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { redirectBoundEmployeeFromOpeningGuide } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const visible = ref(false) // 页面是否展示
const description = hasAccessByCodes(['hrm:employee:create'])
  ? '请先在员工管理中创建员工档案，并将绑定用户设置为当前后台账号。'
  : '请联系公司管理员在员工管理中创建员工档案，并绑定当前后台账号。'

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 前往员工档案列表 */
function goEmployee() {
  uni.navigateTo({ url: '/pages-hrm/employee/index' })
}

/** 初始化 */
onMounted(async () => {
  visible.value = !(await redirectBoundEmployeeFromOpeningGuide())
})
</script>
