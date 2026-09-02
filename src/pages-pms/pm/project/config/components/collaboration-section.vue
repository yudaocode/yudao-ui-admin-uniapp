<template>
  <scroll-view scroll-y class="min-h-0 flex-1">
    <view class="p-24rpx pb-60rpx">
      <view
        v-for="item in configurationList"
        :key="item.type"
        class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-8rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">{{ item.name }}</text>
          <wd-button
            v-if="hasAccessByCodes(['pms:pm:work-item:update'])"
            size="small" type="primary" variant="plain"
            @click="handleStatusConfig(item.type)"
          >
            状态设置
          </wd-button>
        </view>
        <view class="text-24rpx text-[#999]">
          适用项目：{{ item.projectTypeName }}
        </view>
        <view class="mt-8rpx text-24rpx text-[#999]">
          {{ item.description }}
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { PmsWorkItemConfigurationOptions } from '@/pages-pms/pm/utils/constants'

const props = defineProps<{
  projectId: number
  projectType: number
}>()

const { hasAccessByCodes } = useAccess()
const configurationList = computed(() =>
  PmsWorkItemConfigurationOptions.filter(option =>
    option.projectTypes.includes(props.projectType),
  ),
) // 当前项目可配置的事项类型

/** 打开状态设置 */
function handleStatusConfig(type: number) {
  uni.navigateTo({ url: `/pages-pms/pm/workitem/status/index?projectId=${props.projectId}&type=${type}` })
}
</script>
