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
          选择设备
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.code" placeholder="设备编码" clearable />
        <wd-input v-model="queryParams.name" placeholder="设备名称" clearable class="mt-12rpx" />
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
            :class="selected?.id === item.id ? 'ring-2 ring-[#1677ff]' : isDisabled(item.id) ? 'opacity-40' : ''"
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
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_DV_MACHINERY_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>品牌：{{ item.brand || '-' }}</view>
              <view>规格型号：{{ item.specification || '-' }}</view>
              <view>车间：{{ item.workshopName || '-' }}</view>
            </view>
            <view v-if="isDisabled(item.id)" class="mt-12rpx text-24rpx text-[#999]">
              已关联
            </view>
          </view>
          <view v-if="list.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选设备" />
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
import type { DvMachinery } from '@/api/mes/dv/machinery'
import { ref } from 'vue'
import { getMachineryPage } from '@/api/mes/dv/machinery'
import { DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  existingIds?: number[]
}>(), {
  existingIds: () => [],
})

const emit = defineEmits<{
  confirm: [item: DvMachinery]
}>()

const visible = ref(false) // 弹层显示状态
const loading = ref(false) // 加载状态
const list = ref<DvMachinery[]>([]) // 设备列表
const selected = ref<DvMachinery>() // 当前选择设备
const pageNo = ref(1) // 当前页码
const total = ref(0) // 总条数
const queryParams = ref<Record<string, any>>({
  code: '',
  name: '',
}) // 查询参数

/** 判断设备是否已关联 */
function isDisabled(id: number) {
  return props.existingIds.includes(id)
}

/** 选择设备 */
function handleSelect(item: DvMachinery) {
  if (isDisabled(item.id)) {
    return
  }
  selected.value = item
}

/** 加载设备列表 */
async function loadList(append = false) {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    const data = await getMachineryPage({
      pageNo: pageNo.value,
      pageSize: 20,
      code: queryParams.value.code || undefined,
      name: queryParams.value.name || undefined,
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
