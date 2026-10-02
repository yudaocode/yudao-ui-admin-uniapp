<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="请假列表"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <LeaveSearchForm @search="handleSearch" @reset="handleReset" />

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无请假记录"
      @query="queryList"
    >
      <view class="bpm-list">
        <!-- 请假列表 -->
        <view
          v-for="item in list"
          :key="item.id"
          class="bpm-card"
          @click="handleDetail(item)"
        >
          <view class="bpm-card-content">
            <view class="bpm-card-header">
              <view class="bpm-card-title">
                <dict-tag :type="DICT_TYPE.BPM_OA_LEAVE_TYPE" :value="item.type" />
              </view>
              <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="item.status" />
            </view>
            <view class="bpm-summary">
              <view class="bpm-summary-item">
                <text class="text-[#999]">申请编号：</text>
                <text>{{ item.id }}</text>
              </view>
              <view class="bpm-summary-item">
                <text class="text-[#999]">开始时间：</text>
                <text>{{ formatDateTime(item.startTime) }}</text>
              </view>
              <view class="bpm-summary-item">
                <text class="text-[#999]">结束时间：</text>
                <text>{{ formatDateTime(item.endTime) }}</text>
              </view>
              <view class="bpm-summary-item">
                <text class="text-[#999]">请假原因：</text>
                <text>{{ item.reason }}</text>
              </view>
            </view>
            <view class="bpm-card-info">
              <view class="bpm-user">
                <view class="bpm-avatar">
                  {{ userNickname?.[0] }}
                </view>
                <text class="bpm-nickname">{{ userNickname }}</text>
              </view>
              <text class="bpm-time">{{ formatDateTime(item.createTime) }}</text>
            </view>
          </view>
          <view class="bpm-actions">
            <view v-if="hasAccessByCodes(['bpm:oa-leave:query'])" class="bpm-action-btn" @click.stop="handleDetail(item)">
              <wd-icon name="eye" size="32rpx" />
              <text class="ml-8rpx">详情</text>
            </view>
            <view v-if="hasAccessByCodes(['bpm:oa-leave:query'])" class="bpm-action-btn" @click.stop="handleProgress(item)">
              <wd-icon name="list" size="32rpx" />
              <text class="ml-8rpx">审批进度</text>
            </view>
            <view
              v-if="item.status === BpmProcessInstanceStatus.RUNNING && hasAccessByCodes(['bpm:process-instance:cancel'])"
              class="bpm-action-btn text-[#ff4d4f]!"
              @click.stop="handleCancel(item)"
            >
              <wd-icon name="close" size="32rpx" color="#ff4d4f" />
              <text class="ml-8rpx">取消</text>
            </view>
            <view
              v-if="item.status !== BpmProcessInstanceStatus.RUNNING && hasAccessByCodes(['bpm:oa-leave:create'])"
              class="bpm-action-btn"
              @click.stop="handleReCreate(item)"
            >
              <wd-icon name="refresh" size="32rpx" />
              <text class="ml-8rpx">重新发起</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['bpm:oa-leave:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleCreate"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Leave } from '@/api/bpm/oa/leave'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getLeavePage } from '@/api/bpm/oa/leave'
import { cancelProcessInstanceByStartUser } from '@/api/bpm/processInstance'
import { useAccess } from '@/hooks/useAccess'
import { useUserStore } from '@/store'
import { navigateBackPlus } from '@/utils'
import { BpmProcessInstanceStatus, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import LeaveSearchForm from './components/search-form.vue'
import '@/pages/bpm/styles/index.scss'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const userStore = useUserStore()
const toast = useToast()
const userNickname = computed(() => userStore.userInfo?.nickname || '')

const list = ref<Leave[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询请假记录列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getLeavePage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 搜索按钮操作 */
function handleSearch(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleSearch()
}

/** 查看详情 */
function handleDetail(item: Leave) {
  uni.navigateTo({ url: `/pages-bpm/oa/leave/detail/index?id=${item.id}` })
}

/** 审批进度 */
function handleProgress(item: Leave) {
  uni.navigateTo({ url: `/pages-bpm/processInstance/detail/index?id=${item.processInstanceId}` })
}

/** 取消请假 */
function handleCancel(item: Leave) {
  uni.showModal({
    title: '取消流程',
    editable: true,
    placeholderText: '请输入取消原因',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      const reason = res.content?.trim()
      if (!reason) {
        toast.show('请输入取消原因')
        return
      }
      await cancelProcessInstanceByStartUser(String(item.processInstanceId), reason)
      toast.success('取消成功')
      reload()
    },
  })
}

/** 发起请假 */
function handleCreate() {
  uni.navigateTo({ url: '/pages-bpm/oa/leave/create/index' })
}

/** 重新发起请假 */
function handleReCreate(item: Leave) {
  uni.navigateTo({ url: `/pages-bpm/oa/leave/create/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('bpm:oa-leave:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('bpm:oa-leave:reload', reload)
})
</script>
