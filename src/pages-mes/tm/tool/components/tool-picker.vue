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
          选择工具
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="searchCode" placeholder="工具编码" clearable />
        <wd-input v-model="searchName" placeholder="工具名称" clearable class="mt-12rpx" />
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
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无工具"
        @query="queryList"
      >
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
                  {{ item.name || item.code || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_TM_TOOL_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>类型：{{ item.toolTypeName || '-' }}</view>
              <view>品牌：{{ item.brand || '-' }}</view>
              <view>规格：{{ item.specification || '-' }}</view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { TmTool } from '@/api/mes/tm/tool'
import { ref } from 'vue'
import { getToolPage } from '@/api/mes/tm/tool'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  confirm: [item: TmTool]
}>()

const visible = ref(false) // 弹层显示状态
const list = ref<TmTool[]>([]) // 工具列表
const selected = ref<TmTool>() // 当前选择工具
const pagingRef = ref<ZPagingRef<TmTool>>() // 分页组件引用
const searchCode = ref('') // 工具编码
const searchName = ref('') // 工具名称

/** 打开选择器 */
function open() {
  visible.value = true
  selected.value = undefined
  searchCode.value = ''
  searchName.value = ''
  reload()
}

/** 查询工具列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getToolPage({
      pageNo,
      pageSize,
      code: searchCode.value || undefined,
      name: searchName.value || undefined,
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

/** 搜索 */
function handleSearch() {
  reload()
}

/** 重置搜索 */
function handleResetSearch() {
  searchCode.value = ''
  searchName.value = ''
  reload()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  selected.value = undefined
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
