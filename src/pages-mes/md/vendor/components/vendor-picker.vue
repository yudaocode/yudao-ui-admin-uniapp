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
        <wd-button size="small" type="primary" :disabled="tempSelected.length === 0" @click="handleConfirm">
          确定{{ tempSelected.length ? `(${tempSelected.length})` : '' }}
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.code" placeholder="供应商编码" clearable />
        <wd-input v-model="queryParams.name" placeholder="供应商名称" clearable class="mt-12rpx" />
        <wd-input v-model="queryParams.nickname" placeholder="供应商简称" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 供应商列表 -->
      <z-paging
        ref="pagingRef"
        v-model="vendorList"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可选供应商"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in vendorList"
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
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { MdVendor } from '@/api/mes/md/vendor'
import { ref } from 'vue'
import { getVendorPage } from '@/api/mes/md/vendor'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  title?: string
  multiple?: boolean
}>(), {
  title: '选择供应商',
  multiple: false,
})

const emit = defineEmits<{
  confirm: [vendors: MdVendor[]]
}>()

const visible = ref(false) // 弹层显示状态
const vendorList = ref<MdVendor[]>([]) // 供应商列表
const tempSelected = ref<MdVendor[]>([]) // 临时选中供应商
const pagingRef = ref<ZPagingRef<MdVendor>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  code: '',
  name: '',
  nickname: '',
})

/** 判断是否临时选中 */
function isTempSelected(id: number): boolean {
  return tempSelected.value.some(item => item.id === id)
}

/** 切换选中 */
function toggleItem(item: MdVendor) {
  const idx = tempSelected.value.findIndex(vendor => vendor.id === item.id)
  if (idx >= 0) {
    tempSelected.value.splice(idx, 1)
  } else if (!props.multiple) {
    tempSelected.value = [item]
  } else {
    tempSelected.value.push(item)
  }
}

/** 查询供应商列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getVendorPage({
      pageNo,
      pageSize,
      code: queryParams.value.code || undefined,
      name: queryParams.value.name || undefined,
      nickname: queryParams.value.nickname || undefined,
      status: CommonStatusEnum.ENABLE,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开选择器 */
function open() {
  visible.value = true
  tempSelected.value = []
  queryParams.value = {
    code: '',
    name: '',
    nickname: '',
  }
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 搜索按钮操作 */
function handleQuery() {
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {
    code: '',
    name: '',
    nickname: '',
  }
  reload()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  tempSelected.value = []
  queryParams.value = {
    code: '',
    name: '',
    nickname: '',
  }
}

/** 确认选择 */
function handleConfirm() {
  emit('confirm', [...tempSelected.value])
  visible.value = false
}

defineExpose({ open })
</script>
