<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="!tempSelected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.name" placeholder="请输入表情包名称" clearable />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 表情包列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可选表情包"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx flex items-center gap-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="tempSelected?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="handleSelect(item)"
          >
            <view class="shrink-0">
              <wd-img
                v-if="item.icon"
                :src="item.icon"
                width="80rpx"
                height="80rpx"
                radius="12rpx"
                mode="aspectFill"
              />
              <view v-else class="h-80rpx w-80rpx flex items-center justify-center rounded-12rpx bg-[#f0f0f0] text-24rpx text-[#bbb]">
                无
              </view>
            </view>
            <view class="min-w-0 flex-1">
              <view class="mb-10rpx flex items-center justify-between gap-16rpx">
                <text class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </text>
                <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
              </view>
              <view class="text-24rpx text-[#999]">
                排序：{{ item.sort ?? 0 }}
              </view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ImManagerFacePackVO } from '@/api/im/manager/face/pack'
import { ref } from 'vue'
import { getManagerFacePackPage } from '@/api/im/manager/face/pack'
import { DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  title?: string
}>(), {
  title: '选择表情包',
})

const emit = defineEmits<{
  confirm: [pack: ImManagerFacePackVO]
}>()

const visible = ref(false) // 弹窗显示状态
const list = ref<ImManagerFacePackVO[]>([]) // 表情包列表
const tempSelected = ref<ImManagerFacePackVO>() // 临时选中表情包
const pagingRef = ref<ZPagingRef<ImManagerFacePackVO>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  name: '',
})

/** 查询表情包列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerFacePackPage({
      pageNo,
      pageSize,
      name: queryParams.value.name || undefined,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开选择器 */
function open(selected?: ImManagerFacePackVO) {
  visible.value = true
  tempSelected.value = selected
  queryParams.value = {
    name: '',
  }
  pagingRef.value?.reload()
}

/** 选择表情包 */
function handleSelect(item: ImManagerFacePackVO) {
  tempSelected.value = item
}

/** 搜索按钮操作 */
function handleQuery() {
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {
    name: '',
  }
  pagingRef.value?.reload()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  tempSelected.value = undefined
  queryParams.value = {
    name: '',
  }
}

/** 确认选择 */
function handleConfirm() {
  if (!tempSelected.value) {
    return
  }
  emit('confirm', tempSelected.value)
  visible.value = false
}

defineExpose({ open })
</script>
