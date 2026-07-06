<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 头部 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.code" placeholder="方案编码" clearable />
        <wd-input v-model="queryParams.name" placeholder="方案名称" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleResetSearch">
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
            @click="handleSelect(item)"
          >
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.name || item.code || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view class="flex items-center">
                <text class="mr-8rpx text-[#999]">方案类型：</text>
                <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="item.type" />
                <text v-else>-</text>
              </view>
              <view>周期：{{ item.cycleCount ?? '-' }} / {{ getDictLabel(DICT_TYPE.MES_DV_CYCLE_TYPE, item.cycleType) || '-' }}</view>
            </view>
          </view>
          <view v-if="list.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选方案" />
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
import type { DvCheckPlan } from '@/api/mes/dv/checkplan'
import { ref } from 'vue'
import { getCheckPlanPage } from '@/api/mes/dv/checkplan'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE, MesDvCheckPlanStatusEnum, MesDvSubjectTypeEnum } from '@/utils/constants'

const props = withDefaults(defineProps<{
  title?: string
  type?: number
  status?: number
}>(), {
  title: '选择点检方案',
  type: MesDvSubjectTypeEnum.CHECK,
  status: MesDvCheckPlanStatusEnum.ENABLED,
})

const emit = defineEmits<{
  confirm: [item: DvCheckPlan]
}>()

const visible = ref(false) // 弹层显示状态
const loading = ref(false) // 加载状态
const list = ref<DvCheckPlan[]>([]) // 方案列表
const selected = ref<DvCheckPlan>() // 当前选择方案
const pageNo = ref(1) // 当前页码
const total = ref(0) // 总条数
const queryParams = ref<Record<string, any>>({
  code: '',
  name: '',
}) // 查询参数

/** 选择方案 */
function handleSelect(item: DvCheckPlan) {
  selected.value = item
}

/** 加载方案列表 */
async function loadList(append = false) {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    const data = await getCheckPlanPage({
      pageNo: pageNo.value,
      pageSize: 20,
      code: queryParams.value.code || undefined,
      name: queryParams.value.name || undefined,
      type: props.type,
      status: props.status,
    })
    if (append) {
      list.value.push(...data.list)
    } else {
      list.value = data.list
    }
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 打开选择器 */
function open() {
  visible.value = true
  selected.value = undefined
  queryParams.value = { code: '', name: '' }
  list.value = []
  total.value = 0
  pageNo.value = 1
  loadList()
}

/** 搜索 */
async function handleSearch() {
  pageNo.value = 1
  await loadList()
}

/** 重置搜索 */
function handleResetSearch() {
  queryParams.value = { code: '', name: '' }
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

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  selected.value = undefined
  queryParams.value = { code: '', name: '' }
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
