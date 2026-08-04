<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="社保管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 月度社保表列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="20"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-enabled="false"
      empty-view-text="暂无月度社保表"
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
              {{ item.title || '-' }}
            </view>
            <dict-tag
              v-if="item.status != null"
              :type="DICT_TYPE.HRM_INSURANCE_MONTH_STATUS"
              :value="item.status"
            />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">参保：</text>{{ item.insuredEmployeeCount ?? 0 }} 人
            <text class="mx-8rpx text-[#ddd]">|</text>
            <text class="mr-8rpx text-[#999]">停保：</text>{{ item.stoppedEmployeeCount ?? 0 }} 人
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">个人社保：</text>{{ formatHrmMoney(item.personalInsuranceAmount) }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">公司社保：</text>{{ formatHrmMoney(item.corporateInsuranceAmount) }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">个人公积金：</text>{{ formatHrmMoney(item.personalProvidentFundAmount) }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">公司公积金：</text>{{ formatHrmMoney(item.corporateProvidentFundAmount) }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新建按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:insurance:month-record:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleCreate"
    />

    <FirstMonthForm ref="firstMonthFormRef" @success="handleCreateFirstSuccess" />
  </view>
</template>

<script lang="ts" setup>
import type { InsuranceMonthRecord } from '@/api/hrm/insurance/month-record'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  createNextInsuranceMonthRecord,
  getInsuranceMonthRecordList,
  getLastInsuranceMonthRecord,
} from '@/api/hrm/insurance/month-record'
import { useAccess } from '@/hooks/useAccess'
import { formatHrmMoney } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import FirstMonthForm from './components/first-month-form.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<InsuranceMonthRecord[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const createLoading = ref(false) // 新建次月加载中
const queryYear = ref(new Date().getFullYear()) // 查询年份
const yearInited = ref(false) // 是否已按最近月表初始化年份
const latestRecord = ref<InsuranceMonthRecord>() // 最近月度社保表
const firstMonthFormRef = ref<InstanceType<typeof FirstMonthForm>>() // 首月社保表单

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询月度社保表列表 */
async function queryList() {
  try {
    latestRecord.value = await getLastInsuranceMonthRecord()
    if (!yearInited.value && latestRecord.value?.year) {
      queryYear.value = latestRecord.value.year
      yearInited.value = true
    }
    const data = await getInsuranceMonthRecordList(queryYear.value)
    list.value = data
    pagingRef.value?.completeByTotal(data, data.length)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryYear.value = data?.year ?? new Date().getFullYear()
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({ year: new Date().getFullYear() })
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看详情 */
function handleDetail(item: InsuranceMonthRecord) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/insurance/month-record/detail/index?id=${item.id}`,
  })
}

/** 新建月度社保表 */
function handleCreate() {
  if (!latestRecord.value) {
    firstMonthFormRef.value?.open()
    return
  }
  handleCreateNext()
}

/** 首月社保表创建成功 */
function handleCreateFirstSuccess(year: number) {
  queryYear.value = year
  uni.$emit('hrm:insurance:month-record:reload')
  reload()
}

/** 新建次月社保表 */
async function handleCreateNext() {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '新建次月社保后，本月数据将不可修改。请确认要新建次月社保吗？',
    })
  } catch {
    return
  }
  createLoading.value = true
  try {
    const id = await createNextInsuranceMonthRecord()
    toast.success('新建成功')
    uni.$emit('hrm:insurance:month-record:reload')
    uni.navigateTo({
      url: `/pages-hrm/insurance/month-record/detail/index?id=${id}`,
    })
  } finally {
    createLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:insurance:month-record:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:insurance:month-record:reload', reload)
})
</script>
