<template>
  <view class="h-full min-h-0 flex flex-col">
    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 日志列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无短信日志数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between">
              <view class="text-32rpx text-[#333] font-semibold">
                {{ item.mobile }}
              </view>
              <dict-tag :type="DICT_TYPE.SYSTEM_SMS_SEND_STATUS" :value="item.sendStatus" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">短信渠道：</text>
              <dict-tag :type="DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE" :value="item.channelCode" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">短信类型：</text>
              <dict-tag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="item.templateType" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">短信内容：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.templateContent }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">接收状态：</text>
              <dict-tag :type="DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS" :value="item.receiveStatus" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">发送时间：</text>
              <text>{{ formatDateTime(item.sendTime) || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">接收时间：</text>
              <text>{{ formatDateTime(item.receiveTime) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { SmsLog } from '@/api/system/sms/log'
import { ref } from 'vue'
import { getSmsLogPage } from '@/api/system/sms/log'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './search-form.vue'

const props = defineProps<{
  active?: boolean
}>()

const list = ref<SmsLog[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getSmsLogPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看详情 */
function handleDetail(item: SmsLog) {
  uni.navigateTo({
    url: `/pages-system/sms/log/detail/index?id=${item.id}`,
  })
}
</script>
