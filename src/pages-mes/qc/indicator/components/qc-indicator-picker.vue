<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 82vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 头部 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择质检指标
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="query.code" placeholder="检测项编码" clearable />
        <wd-input v-model="query.name" placeholder="检测项名称" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 列表 -->
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleLoadMore">
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selected?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selected = item"
          >
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_INDICATOR_TYPE" :value="item.type" />
            </view>
            <view class="text-26rpx text-[#666] space-y-6rpx">
              <view>检测工具：{{ item.tool || '-' }}</view>
              <view>
                结果值类型：
                <dict-tag v-if="item.resultType != null" :type="DICT_TYPE.MES_QC_RESULT_TYPE" :value="item.resultType" />
                <text v-else>-</text>
              </view>
              <view>结果值属性：{{ item.resultSpecification || '-' }}</view>
            </view>
          </view>
          <view v-if="list.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选质检指标" />
          </view>
          <view v-if="loading" class="flex justify-center py-24rpx">
            <wd-loading />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { QcIndicator } from '@/api/mes/qc/indicator'
import { reactive, ref } from 'vue'
import { getIndicatorPage } from '@/api/mes/qc/indicator'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  confirm: [item: QcIndicator]
}>()

const visible = ref(false) // 弹层显示状态
const loading = ref(false) // 列表加载状态
const list = ref<QcIndicator[]>([]) // 指标列表
const selected = ref<QcIndicator>() // 当前选中
const pageNo = ref(1) // 当前页码
const total = ref(0) // 总条数
const query = reactive<Record<string, any>>({
  code: undefined,
  name: undefined,
}) // 搜索条件

/** 加载质检指标列表 */
async function loadList(append = false, selectedId?: number) {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    const data = await getIndicatorPage({
      ...query,
      pageNo: pageNo.value,
      pageSize: 20,
    })
    if (append) {
      list.value.push(...data.list)
    } else {
      list.value = data.list
    }
    total.value = data.total
    if (selectedId && !selected.value) {
      selected.value = list.value.find(item => item.id === selectedId)
    }
  } finally {
    loading.value = false
  }
}

/** 打开选择器 */
function open(currentId?: number) {
  visible.value = true
  selected.value = undefined
  pageNo.value = 1
  total.value = 0
  list.value = []
  loadList(false, currentId)
}

/** 搜索 */
function handleSearch() {
  pageNo.value = 1
  loadList()
}

/** 重置 */
function handleReset() {
  query.code = undefined
  query.name = undefined
  pageNo.value = 1
  loadList()
}

/** 加载更多 */
async function handleLoadMore() {
  if (loading.value || list.value.length >= total.value) {
    return
  }
  pageNo.value += 1
  await loadList(true)
}

/** 确认选择 */
function handleConfirm() {
  if (!selected.value) {
    return
  }
  emit('confirm', selected.value)
  visible.value = false
}

defineExpose({ open })
</script>
