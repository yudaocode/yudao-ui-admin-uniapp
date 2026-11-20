<template>
  <view class="h-full min-h-0 flex flex-col">
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无待修改任务"
      @query="queryList"
    >
      <view class="bpm-list">
        <!-- 待我修改列表 -->
        <view
          v-for="item in list"
          :key="item.id"
          class="bpm-card"
          @click="handleDetail(item)"
        >
          <view class="bpm-card-content">
            <view class="bpm-card-header">
              <view class="bpm-card-title">
                {{ item.processInstance?.name }}
              </view>
              <dict-tag :type="DICT_TYPE.BPM_TASK_STATUS" :value="item.status" />
            </view>
            <view class="bpm-summary">
              <view class="bpm-summary-item">
                <text class="text-[#999]">当前审批节点：</text>
                <text>{{ item.name }}</text>
              </view>
              <view v-if="item.reason" class="bpm-summary-item">
                <text class="text-[#999]">退回原因：</text>
                <text>{{ item.reason }}</text>
              </view>
            </view>
            <view class="bpm-card-info">
              <view class="bpm-user">
                <view class="bpm-avatar">
                  {{ item.processInstance?.startUser?.nickname?.[0] || '?' }}
                </view>
                <text class="bpm-nickname">{{ item.processInstance?.startUser?.nickname }}</text>
              </view>
              <text class="bpm-time">{{ formatDateTime(item.processInstance?.createTime) }}</text>
            </view>
          </view>
          <view class="bpm-actions">
            <view class="bpm-action-btn" @click.stop="handleDetail(item)">
              <text>修改</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Task } from '@/api/bpm/task'
import { onMounted, onUnmounted, ref } from 'vue'
import { getTaskRevisionPage } from '@/api/bpm/task'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import '../styles/index.scss'

const list = ref<Task[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 查询待我修改的任务列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTaskRevisionPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 进入详情页，修改表单后重新提交 */
function handleDetail(item: Task) {
  uni.navigateTo({ url: `/pages-bpm/processInstance/detail/index?id=${item.processInstanceId}&taskId=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('bpm:task:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('bpm:task:reload', reload)
})
</script>
