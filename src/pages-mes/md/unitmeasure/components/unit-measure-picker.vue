<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 72vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 头部 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择计量单位
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="keyword" placeholder="搜索单位编码或名称" clearable />
      </view>

      <!-- 列表 -->
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
        <view class="p-24rpx">
          <view
            v-for="item in filteredList"
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
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">主单位：</text>{{ item.primaryFlag ? '是' : '否' }}
            </view>
          </view>
          <view v-if="filteredList.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选计量单位" />
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
import type { MdUnitMeasure } from '@/api/mes/md/unitmeasure'
import { computed, ref } from 'vue'
import { getUnitMeasureSimpleList } from '@/api/mes/md/unitmeasure'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  confirm: [item: MdUnitMeasure]
}>()

const visible = ref(false) // 弹层显示状态
const loading = ref(false) // 列表加载状态
const list = ref<MdUnitMeasure[]>([]) // 计量单位列表
const selected = ref<MdUnitMeasure>() // 当前选中
const keyword = ref('') // 搜索关键词

const filteredList = computed(() => { // 搜索后的计量单位
  const value = keyword.value.trim().toLowerCase()
  if (!value) {
    return list.value
  }
  return list.value.filter(item =>
    item.name.toLowerCase().includes(value) || item.code.toLowerCase().includes(value),
  )
})

/** 打开选择器 */
function open(currentId?: number) {
  visible.value = true
  keyword.value = ''
  selected.value = undefined
  loadList().then(() => {
    selected.value = list.value.find(item => item.id === currentId)
  })
}

/** 加载计量单位列表 */
async function loadList() {
  if (list.value.length > 0) {
    return
  }
  loading.value = true
  try {
    list.value = await getUnitMeasureSimpleList()
  } finally {
    loading.value = false
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
