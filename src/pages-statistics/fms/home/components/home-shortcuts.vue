<template>
  <!-- 常用功能：按权限和账套可写状态过滤 -->
  <view v-if="visibleShortcuts.length > 0" class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        常用功能
      </view>
      <view class="mt-4rpx text-24rpx text-[#999]">
        快速进入日常财务工作
      </view>
    </view>
    <view class="grid grid-cols-4 gap-16rpx p-24rpx">
      <view
        v-for="(shortcut, index) in visibleShortcuts"
        :key="shortcut.path"
        class="flex flex-col items-center gap-12rpx active:opacity-80"
        @click="goTo(shortcut.path)"
      >
        <view
          class="h-88rpx w-88rpx flex items-center justify-center rounded-16rpx"
          :style="{ backgroundColor: `${FMS_HOME_METRIC_COLORS[index % FMS_HOME_METRIC_COLORS.length]}1a` }"
        >
          <wd-icon
            :name="shortcut.icon"
            size="44rpx"
            :color="FMS_HOME_METRIC_COLORS[index % FMS_HOME_METRIC_COLORS.length]"
          />
        </view>
        <text class="text-24rpx text-[#333]">
          {{ shortcut.name }}
        </text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FMS_HOME_METRIC_COLORS } from '@/pages-fms/utils/constants'

const SHORTCUTS = [ // 常用功能；writeRequired 要求账套可写，对齐 PC FmsHomeShortcuts
  {
    name: '录凭证',
    description: '新增会计凭证',
    icon: 'edit',
    path: '/pages-fms/voucher/create/index',
    permission: 'fms:voucher:create',
    writeRequired: true,
  },
  {
    name: '查凭证',
    description: '查询会计凭证',
    icon: 'search-line',
    path: '/pages-fms/voucher/list/index',
    permission: 'fms:voucher:query',
    writeRequired: false,
  },
  {
    name: '科目余额表',
    description: '查看科目余额',
    icon: 'dashboard',
    path: '/pages-fms/ledger/subject-balance/index',
    permission: 'fms:ledger:subject-balance:query',
    writeRequired: false,
  },
  {
    name: '明细账',
    description: '查看科目明细',
    icon: 'file',
    path: '/pages-fms/ledger/detail/index',
    permission: 'fms:ledger:detail:query',
    writeRequired: false,
  },
]

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()

const visibleShortcuts = computed(() =>
  SHORTCUTS.filter(
    shortcut =>
      hasAccessByCodes([shortcut.permission])
      && (!shortcut.writeRequired || fmsStore.isAccountSetWritable),
  ),
) // 可见的常用功能

/** 跳转常用功能 */
function goTo(path: string) {
  uni.navigateTo({ url: path })
}
</script>
