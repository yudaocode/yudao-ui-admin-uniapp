<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="计税规则"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 计税规则列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="50"
      :refresher-enabled="true"
      :auto="true"
      :hide-no-more-by-limit="0"
      empty-view-text="暂无计税规则"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <dict-tag
              v-if="item.type != null"
              :type="DICT_TYPE.HRM_SALARY_TAX_TYPE"
              :value="item.type"
            />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">是否计税：</text>{{ item.taxEnabled == null ? '-' : (item.taxEnabled ? '是' : '否') }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">起征点：</text>{{ item.threshold == null ? '-' : `${item.threshold}元/月` }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">小数位：</text>{{ item.decimalScale == null ? '-' : `保留${item.decimalScale}位小数` }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">计税周期：</text>{{ formatHrmSalaryTaxCycleType(item.cycleType) }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">适用薪资组：</text>{{ item.usedGroupCount ?? 0 }}个薪资组正在使用
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:salary:tax-rule:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SalaryTaxRule } from '@/api/hrm/salary/config/tax-rule'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getSalaryTaxRuleList } from '@/api/hrm/salary/config/tax-rule'
import { useAccess } from '@/hooks/useAccess'
import { formatHrmSalaryTaxCycleType } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<SalaryTaxRule[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询计税规则列表 */
async function queryList() {
  try {
    const data = await getSalaryTaxRuleList()
    pagingRef.value?.completeByTotal(data, data.length)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增计税规则 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/salary/config/tax-rule/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: SalaryTaxRule) {
  uni.navigateTo({
    url: `/pages-hrm/salary/config/tax-rule/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:salary:tax-rule:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:salary:tax-rule:reload', reload)
})
</script>
