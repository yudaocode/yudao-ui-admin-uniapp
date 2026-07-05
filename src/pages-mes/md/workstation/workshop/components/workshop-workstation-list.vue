<template>
  <view class="min-h-0 flex flex-1 flex-col bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        工作站
      </view>
      <view class="text-24rpx text-[#999]">
        共 {{ total }} 条
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="5"
      :refresher-enabled="false"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无工作站数据"
      @query="queryList"
    >
      <view class="px-24rpx py-8rpx pb-160rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
          @click="handleDetail(item)"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-medium">
                {{ item.name || '-' }}
              </view>
              <view class="mt-4rpx truncate text-26rpx text-[#666]">
                {{ item.code || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">所属工序：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.processName || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">地点：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.address || '-' }}</text>
          </view>
          <view v-if="item.remark" class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.remark }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { MdWorkstation } from '@/api/mes/md/workstation'
import { nextTick, ref, watch } from 'vue'
import { getWorkstationPage } from '@/api/mes/md/workstation'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  workshopId?: number
}>()

const list = ref<MdWorkstation[]>([]) // 工作站列表
const total = ref(0) // 总条数
const pagingRef = ref<ZPagingRef<MdWorkstation>>() // 分页组件引用

/** 查询工作站列表 */
async function queryList(currentPageNo: number, currentPageSize: number) {
  if (!props.workshopId) {
    total.value = 0
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getWorkstationPage({
      pageNo: currentPageNo,
      pageSize: currentPageSize,
      workshopId: props.workshopId,
    })
    total.value = data.total
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 查看工作站详情 */
function handleDetail(item: MdWorkstation) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/md/workstation/detail/index?id=${item.id}` })
}

/** 监听车间编号变化 */
watch(
  () => props.workshopId,
  async () => {
    total.value = 0
    list.value = []
    await nextTick()
    pagingRef.value?.reload()
  },
  { immediate: true },
)
</script>
