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
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.code" placeholder="项目编码" clearable />
        <wd-input v-model="queryParams.name" placeholder="项目名称" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 点检项列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可选项目"
        @query="queryList"
      >
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
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="item.type" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>项目内容：{{ item.content || '-' }}</view>
              <view>标准：{{ item.standard || '-' }}</view>
            </view>
            <view v-if="isDisabled(item.id)" class="mt-12rpx text-24rpx text-[#999]">
              已关联
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { DvSubject } from '@/api/mes/dv/subject'
import { ref } from 'vue'
import { getSubjectPage } from '@/api/mes/dv/subject'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  title?: string
  type?: number
  existingIds?: number[]
}>(), {
  title: '选择项目',
  existingIds: () => [],
})

const emit = defineEmits<{
  confirm: [item: DvSubject]
}>()

const visible = ref(false) // 弹层显示状态
const list = ref<DvSubject[]>([]) // 项目列表
const selected = ref<DvSubject>() // 当前选择项目
const pagingRef = ref<ZPagingRef<DvSubject>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  code: '',
  name: '',
})

/** 判断项目是否已关联 */
function isDisabled(id: number) {
  return props.existingIds.includes(id)
}

/** 选择项目 */
function handleSelect(item: DvSubject) {
  if (isDisabled(item.id)) {
    return
  }
  selected.value = item
}

/** 查询项目列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSubjectPage({
      pageNo,
      pageSize,
      code: queryParams.value.code || undefined,
      name: queryParams.value.name || undefined,
      type: props.type,
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
  selected.value = undefined
  queryParams.value = {
    code: '',
    name: '',
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
  }
  reload()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  selected.value = undefined
  queryParams.value = {
    code: '',
    name: '',
  }
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
