<template>
  <!-- 报表行列表：项目 / 行次 / 双金额列，小计合计行加粗 -->
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <!-- 表头 -->
    <view class="flex items-center border-b border-[#f0f0f0] px-24rpx py-16rpx text-24rpx text-[#999]">
      <text class="min-w-0 flex-1">项目</text>
      <text class="w-64rpx shrink-0 text-center">行次</text>
      <text class="w-180rpx shrink-0 text-right">{{ primaryLabel }}</text>
      <text class="w-180rpx shrink-0 text-right">{{ secondaryLabel }}</text>
    </view>

    <!-- 报表行 -->
    <view
      v-for="row in rows"
      :key="row.key"
      class="flex items-center border-b border-[#f5f5f5] px-24rpx py-20rpx last:border-b-0"
    >
      <text
        class="min-w-0 flex-1 text-26rpx leading-36rpx"
        :class="[
          row.bold ? 'text-[#333] font-semibold' : 'text-[#666]',
          row.level === 2 ? 'pl-24rpx' : '',
          row.level === 3 ? 'pl-48rpx' : '',
        ]"
      >
        {{ row.name }}
      </text>
      <text class="w-64rpx shrink-0 text-center text-24rpx text-[#999]">
        {{ row.rowNo || '' }}
      </text>
      <text
        class="w-180rpx shrink-0 text-right text-24rpx"
        :class="row.bold ? 'text-[#333] font-semibold' : 'text-[#666]'"
      >
        {{ formatFmsMoney(row.primaryAmount) }}
      </text>
      <text
        class="w-180rpx shrink-0 text-right text-24rpx"
        :class="row.bold ? 'text-[#333] font-semibold' : 'text-[#666]'"
      >
        {{ formatFmsMoney(row.secondaryAmount) }}
      </text>
    </view>

    <!-- 空状态 -->
    <view v-if="!rows.length" class="py-48rpx text-center text-26rpx text-[#999]">
      暂无报表数据
    </view>
  </view>
</template>

<script lang="ts" setup>
import { formatFmsMoney } from '@/pages-fms/utils/format'

/** 报表展示行（由页面按各报表后端行结构归一化） */
export interface ReportDisplayRow {
  key: string | number // 行标识
  name?: string // 项目名称
  rowNo?: number // 行次
  level?: number // 层级，用于缩进
  bold?: boolean // 是否小计 / 合计行
  primaryAmount?: number // 主金额（期末余额 / 本期金额）
  secondaryAmount?: number // 次金额（年初余额 / 本年累计金额）
}

defineProps<{
  rows: ReportDisplayRow[] // 报表行
  primaryLabel: string // 主金额列名
  secondaryLabel: string // 次金额列名
}>()
</script>
