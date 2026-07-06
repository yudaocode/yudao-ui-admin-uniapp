<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="业绩目标详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 基本信息 -->
    <wd-cell-group border>
      <wd-cell title="目标对象" :value="formData.objectName || '-'" />
      <wd-cell title="年份" :value="formData.year ? `${formData.year} 年` : '-'" />
      <wd-cell title="目标类型" :value="getBizTypeLabel(formData.bizType)" />
      <wd-cell title="对象类型" :value="getObjectTypeLabel(formData.objectType)" />
      <wd-cell title="年度目标" :value="formatMoney(formData.yearTargetPrice)" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 月度目标 -->
    <view class="mt-24rpx bg-white">
      <view class="px-24rpx py-20rpx">
        <text class="text-30rpx text-[#333] font-semibold">月度目标</text>
      </view>
      <view class="grid grid-cols-3 gap-12rpx px-24rpx pb-24rpx">
        <view
          v-for="month in monthFields"
          :key="month.prop"
          class="rounded-8rpx bg-[#f8f8f8] px-12rpx py-14rpx"
        >
          <view class="text-22rpx text-[#999]">{{ month.label }}</view>
          <view class="mt-6rpx text-24rpx text-[#333]">{{ formatMoney(formData[month.prop]) }}</view>
        </view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['crm:performance-config:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['crm:performance-config:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PerformanceConfig } from '@/api/crm/performance/config'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deletePerformanceConfig,
  getPerformanceConfig,
  PerformanceConfigObjectTypeEnum,
} from '@/api/crm/performance/config'
import { BizTypeEnum } from '@/api/crm/permission'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<PerformanceConfig>({}) // 详情数据
const deleting = ref(false) // 删除状态
const configId = computed(() => Number(props.id))
const hasFooter = computed(() => {
  return hasAccessByCodes(['crm:performance-config:update']) || hasAccessByCodes(['crm:performance-config:delete'])
})

const bizTypeColumns = [
  { label: '销售目标', value: BizTypeEnum.CRM_CONTRACT },
  { label: '回款目标', value: BizTypeEnum.CRM_RECEIVABLE },
] // 目标类型选项
const objectTypeColumns = [
  { label: '部门', value: PerformanceConfigObjectTypeEnum.DEPT },
  { label: '员工', value: PerformanceConfigObjectTypeEnum.USER },
] // 对象类型选项
const monthFields = [
  { label: '一月', prop: 'januaryTargetPrice' },
  { label: '二月', prop: 'februaryTargetPrice' },
  { label: '三月', prop: 'marchTargetPrice' },
  { label: '四月', prop: 'aprilTargetPrice' },
  { label: '五月', prop: 'mayTargetPrice' },
  { label: '六月', prop: 'juneTargetPrice' },
  { label: '七月', prop: 'julyTargetPrice' },
  { label: '八月', prop: 'augustTargetPrice' },
  { label: '九月', prop: 'septemberTargetPrice' },
  { label: '十月', prop: 'octoberTargetPrice' },
  { label: '十一月', prop: 'novemberTargetPrice' },
  { label: '十二月', prop: 'decemberTargetPrice' },
] as const // 月目标字段

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/performance/config/index')
}

/** 加载详情 */
async function getDetail() {
  if (!configId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPerformanceConfig(configId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/performance/config/form/index?id=${configId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!configId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该业绩目标吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePerformanceConfig(configId.value)
    toast.success('删除成功')
    uni.$emit('crm:performance-config:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 获取目标类型名称 */
function getBizTypeLabel(value?: number) {
  return bizTypeColumns.find(item => item.value === value)?.label || '-'
}

/** 获取对象类型名称 */
function getObjectTypeLabel(value?: number) {
  return objectTypeColumns.find(item => item.value === value)?.label || '-'
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:performance-config:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:performance-config:reload', getDetail)
})
</script>
