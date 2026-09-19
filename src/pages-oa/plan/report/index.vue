<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="计划报表"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 计划类型页签 -->
    <wd-tabs v-model="tabIndex" @change="handleTypeChange">
      <wd-tab
        v-for="tab in tabs"
        :key="tab.title"
        :title="tab.title"
      />
    </wd-tabs>

    <!-- 统计周期：上一期 / 当前期（点击选择日期） / 下一期 -->
    <view class="flex items-center justify-between bg-white px-24rpx py-16rpx">
      <view class="flex items-center gap-8rpx text-28rpx text-[#1677ff]" @click="handlePeriodChange(-1)">
        <wd-icon name="arrow-left" size="28rpx" color="#1677ff" />
        <text>上一期</text>
      </view>
      <view class="flex items-center gap-8rpx text-28rpx text-[#333] font-semibold" @click="periodPickerVisible = true">
        <text>{{ periodText }}</text>
        <wd-icon name="arrow-down" size="28rpx" color="#999" />
      </view>
      <view class="flex items-center gap-8rpx text-28rpx text-[#1677ff]" @click="handlePeriodChange(1)">
        <text>下一期</text>
        <wd-icon name="arrow-right" size="28rpx" color="#1677ff" />
      </view>
    </view>

    <!-- 成员搜索 -->
    <view class="bg-white px-24rpx pb-16rpx" @click="searchVisible = true">
      <wd-search v-model="searchName" placeholder="搜索成员姓名" hide-cancel disabled />
    </view>

    <!-- 成员计划列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无成员数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.userId"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx"
          @click="handleView(item)"
        >
          <view class="mb-12rpx flex items-center justify-between gap-12rpx">
            <text class="line-clamp-1 min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
              {{ item.userName }}<text v-if="item.deptName" class="ml-12rpx text-24rpx text-[#999] font-normal">{{ item.deptName }}</text>
            </text>
            <dict-tag v-if="item.planId" :type="DICT_TYPE.OA_PLAN_STATUS" :value="item.status" />
            <wd-tag v-else type="default">
              未提交
            </wd-tag>
          </view>
          <template v-if="item.planId">
            <view class="line-clamp-1 mb-8rpx text-28rpx text-[#666]">
              {{ item.title }}
            </view>
            <view class="line-clamp-2 text-26rpx text-[#999]">
              {{ item.content }}
            </view>
          </template>
          <view v-else class="text-26rpx text-[#999]">
            该周期内未提交计划
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 周期日期选择 -->
    <wd-datetime-picker
      v-model="periodDate"
      v-model:visible="periodPickerVisible"
      type="date"
      title="选择统计日期"
      @confirm="handlePeriodDateChange"
    />

    <!-- 成员姓名搜索弹窗 -->
    <wd-popup
      v-model="searchVisible"
      position="top"
      :custom-style="getTopPopupStyle()"
      :modal-style="getTopPopupModalStyle()"
      @close="searchVisible = false"
    >
      <view class="yd-search-form-container">
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            成员姓名
          </view>
          <wd-input
            v-model="searchNameInput"
            placeholder="请输入成员姓名"
            clearable
          />
        </view>
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" variant="plain" @click="handleNameReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleNameSearch">
            搜索
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 计划详情弹窗 -->
    <wd-popup
      v-model="detailVisible"
      position="bottom"
      root-portal
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="detailVisible = false"
    >
      <view v-if="currentReport?.planId" class="max-h-70vh overflow-y-auto p-24rpx">
        <view class="mb-16rpx flex items-center justify-between gap-12rpx">
          <text class="line-clamp-1 min-w-0 flex-1 text-32rpx text-[#333] font-semibold">{{ currentReport.title }}</text>
          <dict-tag :type="DICT_TYPE.OA_PLAN_STATUS" :value="currentReport.status" />
        </view>
        <view class="mb-16rpx text-26rpx text-[#999]">
          {{ currentReport.userName }}<text v-if="currentReport.deptName"> · {{ currentReport.deptName }}</text>
          <text v-if="currentReport.label"> · {{ currentReport.label }}</text>
        </view>
        <view class="mb-8rpx text-26rpx text-[#999]">
          计划内容
        </view>
        <view class="mb-16rpx whitespace-pre-wrap text-28rpx text-[#333]">
          {{ currentReport.content || '暂无内容' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#999]">
          计划总结
        </view>
        <view class="mb-16rpx whitespace-pre-wrap text-28rpx text-[#333]">
          {{ currentReport.summary || '暂无总结' }}
        </view>
        <template v-if="currentReport.comment">
          <view class="mb-8rpx text-26rpx text-[#999]">
            计划点评
          </view>
          <view class="mb-16rpx whitespace-pre-wrap text-28rpx text-[#333]">
            {{ currentReport.comment }}
          </view>
        </template>
        <template v-if="currentReport.fileUrls?.length">
          <view class="mb-8rpx text-26rpx text-[#999]">
            附件
          </view>
          <view
            v-for="(url, index) in currentReport.fileUrls"
            :key="index"
            class="mb-12rpx flex items-center gap-12rpx text-26rpx text-[#1677ff]"
            @click="openAttachment(url)"
          >
            <wd-icon name="link" size="26rpx" />
            <text class="line-clamp-1">{{ getFileName(url) }}</text>
          </view>
        </template>
        <wd-button
          v-if="hasAccessByCodes(['oa:plan:comment'])"
          class="mt-16rpx"
          type="primary"
          block
          @click="handleOpenComment"
        >
          点评
        </wd-button>
      </view>
    </wd-popup>

    <!-- 点评弹窗 -->
    <wd-popup
      v-model="commentVisible"
      position="bottom"
      root-portal
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="commentVisible = false"
    >
      <view class="p-24rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
          计划点评
        </view>
        <wd-textarea
          v-model="commentContent"
          :maxlength="1000"
          show-word-limit
          placeholder="请输入点评内容"
        />
        <wd-button
          class="mt-24rpx"
          type="primary"
          block
          :loading="commenting"
          @click="handleSubmitComment"
        >
          提交点评
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { PlanReport } from '@/api/oa/plan'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { addPlanComment, getPlanReportPage } from '@/api/oa/plan'
import { useAccess } from '@/hooks/useAccess'
import { getTopPopupModalStyle, getTopPopupStyle, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateEndTime, formatDateStartTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { OA_PLAN_TYPE } from '../../utils/constants'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const tabs = [ // 计划类型页签，对应日 / 周 / 月统计周期
  { title: '日计划', type: OA_PLAN_TYPE.DAY },
  { title: '周计划', type: OA_PLAN_TYPE.WEEK },
  { title: '月计划', type: OA_PLAN_TYPE.MONTH },
]
const tabIndex = ref(0) // 当前类型页签下标
const periodDate = ref<number>(Date.now()) // 统计日期，周期内任意一天
const periodPickerVisible = ref(false) // 周期日期选择器显示状态
const searchVisible = ref(false) // 成员搜索弹窗显示状态
const searchNameInput = ref('') // 成员姓名输入
const searchName = ref('') // 成员姓名搜索条件
const list = ref<PlanReport[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const detailVisible = ref(false) // 计划详情弹窗显示状态
const currentReport = ref<PlanReport>() // 当前查看的报表行
const commentVisible = ref(false) // 点评弹窗显示状态
const commentContent = ref('') // 点评内容
const commenting = ref(false) // 点评提交状态

/** 统计周期范围：[开始, 结束]，周报固定周一开始 */
const periodRange = computed(() => {
  const date = dayjs(periodDate.value)
  const type = tabs[tabIndex.value]!.type
  if (type === OA_PLAN_TYPE.DAY) {
    const begin = date.startOf('day')
    return [begin, begin]
  }
  if (type === OA_PLAN_TYPE.WEEK) {
    const dayOfWeek = date.day()
    const begin = date.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day').startOf('day')
    return [begin, begin.add(6, 'day')]
  }
  return [date.startOf('month'), date.endOf('month')]
})

/** 周期展示文本 */
const periodText = computed(() => {
  const [begin, end] = periodRange.value
  return `${formatDate(begin.toDate())} ~ ${formatDate(end.toDate())}`
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询报表列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const [begin, end] = periodRange.value
    const data = await getPlanReportPage({
      userName: searchName.value || undefined,
      type: tabs[tabIndex.value]!.type,
      // 查询时间覆盖整个自然周期，包含结束日的最后一秒
      createTime: [formatDateStartTime(begin.toDate()), formatDateEndTime(end.toDate())],
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 切换计划类型 */
function handleTypeChange({ index }: { index: number }) {
  tabIndex.value = index
  periodDate.value = Date.now()
  reload()
}

/** 切换上一个或下一个统计周期 */
function handlePeriodChange(step: number) {
  const unit = tabIndex.value === 0 ? 'day' : tabIndex.value === 1 ? 'week' : 'month'
  periodDate.value = dayjs(periodDate.value).add(step, unit).valueOf()
  reload()
}

/** 选择统计日期 */
function handlePeriodDateChange() {
  reload()
}

/** 搜索成员姓名 */
function handleNameSearch() {
  searchName.value = searchNameInput.value
  searchVisible.value = false
  reload()
}

/** 重置成员姓名 */
function handleNameReset() {
  searchNameInput.value = ''
  searchName.value = ''
  searchVisible.value = false
  reload()
}

/** 查看计划详情：仅已提交计划的行可查看 */
function handleView(item: PlanReport) {
  if (!item.planId) {
    return
  }
  currentReport.value = item
  detailVisible.value = true
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 打开点评弹窗 */
function handleOpenComment() {
  commentContent.value = ''
  commentVisible.value = true
}

/** 提交计划点评 */
async function handleSubmitComment() {
  const comment = commentContent.value.trim()
  if (!currentReport.value?.planId) {
    return
  }
  if (!comment) {
    toast.warning('请输入点评内容')
    return
  }
  commenting.value = true
  try {
    await addPlanComment(currentReport.value.planId, comment)
    toast.success('点评成功')
    commentVisible.value = false
    detailVisible.value = false
    reload()
  } finally {
    commenting.value = false
  }
}
</script>
