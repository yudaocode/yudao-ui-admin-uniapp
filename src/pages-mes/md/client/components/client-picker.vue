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
        <wd-button size="small" type="primary" :disabled="tempSelected.length === 0" @click="handleConfirm">
          确定{{ tempSelected.length ? `(${tempSelected.length})` : '' }}
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="searchCode" placeholder="客户编码" clearable />
        <wd-input v-model="searchName" placeholder="客户名称" clearable class="mt-12rpx" />
        <wd-input v-model="searchNickname" placeholder="客户简称" clearable class="mt-12rpx" />
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
            v-for="item in clientList"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="isTempSelected(item.id) ? 'ring-2 ring-[#1677ff]' : ''"
            @click="toggleItem(item)"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">编码：</text>{{ item.code || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">简称：</text>{{ item.nickname || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">电话：</text>{{ item.telephone || '-' }}
            </view>
          </view>
          <view v-if="clientList.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选客户" />
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
import type { MdClient } from '@/api/mes/md/client'
import { ref } from 'vue'
import { getClientPage } from '@/api/mes/md/client'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  title?: string
  multiple?: boolean
}>(), {
  title: '选择客户',
  multiple: false,
})

const emit = defineEmits<{
  confirm: [clients: MdClient[]]
}>()

const visible = ref(false) // 弹层显示状态
const loading = ref(false) // 加载状态
const clientList = ref<MdClient[]>([]) // 客户列表
const tempSelected = ref<MdClient[]>([]) // 临时选中客户
const pageNo = ref(1) // 当前页码
const total = ref(0) // 总条数
const searchCode = ref('') // 客户编码
const searchName = ref('') // 客户名称
const searchNickname = ref('') // 客户简称

/** 判断是否临时选中 */
function isTempSelected(id: number): boolean {
  return tempSelected.value.some(item => item.id === id)
}

/** 切换选中 */
function toggleItem(item: MdClient) {
  const idx = tempSelected.value.findIndex(client => client.id === item.id)
  if (idx >= 0) {
    tempSelected.value.splice(idx, 1)
  } else if (!props.multiple) {
    tempSelected.value = [item]
  } else {
    tempSelected.value.push(item)
  }
}

/** 搜索 */
async function handleSearch() {
  pageNo.value = 1
  await loadClients()
}

/** 重置搜索 */
function handleResetSearch() {
  searchCode.value = ''
  searchName.value = ''
  searchNickname.value = ''
  pageNo.value = 1
  loadClients()
}

/** 加载更多 */
async function handleLoadMore() {
  if (loading.value || clientList.value.length >= total.value) {
    return
  }
  pageNo.value++
  await loadClients(true)
}

/** 加载客户列表 */
async function loadClients(append = false) {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    const data = await getClientPage({
      pageNo: pageNo.value,
      pageSize: 20,
      code: searchCode.value || undefined,
      name: searchName.value || undefined,
      nickname: searchNickname.value || undefined,
      status: CommonStatusEnum.ENABLE,
    })
    if (append) {
      clientList.value.push(...data.list)
    } else {
      clientList.value = data.list
    }
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 打开选择器 */
function open() {
  visible.value = true
  tempSelected.value = []
  searchCode.value = ''
  searchName.value = ''
  searchNickname.value = ''
  clientList.value = []
  total.value = 0
  pageNo.value = 1
  loadClients()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  tempSelected.value = []
  searchCode.value = ''
  searchName.value = ''
  searchNickname.value = ''
}

/** 确认选择 */
function handleConfirm() {
  emit('confirm', [...tempSelected.value])
  visible.value = false
}

defineExpose({ open })
</script>
