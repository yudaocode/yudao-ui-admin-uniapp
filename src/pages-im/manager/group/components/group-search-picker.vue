<template>
  <view class="yd-search-form-item">
    <!-- 群聊搜索选择入口 -->
    <view class="yd-search-form-label">
      {{ label }}
    </view>
    <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx" @click="open">
      <text class="min-w-0 flex-1 truncate" :class="displayValue ? 'text-[#333]' : 'text-[#999]'">
        {{ displayValue || placeholder }}
      </text>
      <wd-icon
        v-if="clearable && modelValue"
        name="close-circle"
        size="30rpx"
        custom-style="color: #c0c4cc;"
        @click.stop="handleClear"
      />
      <wd-icon v-else name="arrow-right" size="28rpx" color="#c0c4cc" />
    </view>

    <!-- 群聊选择弹窗 -->
    <wd-popup v-model="visible" position="bottom" root-portal custom-style="height: 76vh; border-radius: 24rpx 24rpx 0 0;">
      <view class="h-full flex flex-col overflow-hidden bg-[#f5f5f5]">
        <!-- 弹窗标题栏 -->
        <view class="flex items-center justify-between bg-white px-28rpx py-24rpx">
          <text class="text-28rpx text-[#666]" @click="visible = false">取消</text>
          <text class="text-32rpx text-[#222] font-medium">选择群聊</text>
          <text class="text-28rpx text-[#07c160]" @click="handleConfirm">确定</text>
        </view>
        <!-- 群聊搜索栏 -->
        <view class="bg-white px-20rpx pb-16rpx">
          <wd-search v-model="keyword" placeholder="搜索群名称" hide-cancel @search="reload" @clear="reload" />
        </view>
        <!-- 群聊分页列表 -->
        <z-paging
          ref="pagingRef"
          v-model="list"
          :fixed="false"
          class="min-h-0 flex-1"
          :default-page-size="20"
          empty-view-text="暂无群聊"
          @query="queryList"
        >
          <view class="px-24rpx py-16rpx">
            <view
              v-for="item in list"
              :key="item.id"
              class="mb-16rpx flex items-center gap-20rpx rounded-12rpx bg-white p-22rpx"
              @click="selected = item"
            >
              <wd-img v-if="item.avatar" :src="item.avatar" width="72rpx" height="72rpx" radius="10rpx" />
              <view v-else class="h-72rpx w-72rpx flex items-center justify-center rounded-10rpx bg-[#e8eaed] text-24rpx text-[#999]">
                群
              </view>
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#222]">
                  {{ item.name }}
                </view>
                <view class="mt-6rpx text-23rpx text-[#999]">
                  {{ item.memberCount ?? 0 }} 人 · 群号 {{ item.id }}
                </view>
              </view>
              <wd-icon :name="selected?.id === item.id ? 'check-circle-filled' : 'circle'" size="36rpx" :color="selected?.id === item.id ? '#07c160' : '#c8c9cc'" />
            </view>
          </view>
        </z-paging>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerGroupVO } from '@/api/im/manager/group'
import { onMounted, ref, watch } from 'vue'
import { getManagerGroup, getManagerGroupPage } from '@/api/im/manager/group'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  clearable?: boolean
}>(), {
  label: '群聊',
  placeholder: '请选择群聊',
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [group: ImManagerGroupVO | undefined]
}>()

const visible = ref(false) // 选择弹窗显示状态
const keyword = ref('') // 群名称关键字
const list = ref<ImManagerGroupVO[]>([]) // 群聊候选列表
const pagingRef = ref<any>() // 分页组件引用
const selected = ref<ImManagerGroupVO>() // 当前选择
const displayValue = ref('') // 已选群名称

/** 打开群聊选择器 */
function open() {
  selected.value = props.modelValue
    ? list.value.find(item => item.id === props.modelValue)
    : undefined
  visible.value = true
}

/** 查询群聊列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerGroupPage({
      name: keyword.value || undefined,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 按关键字重新查询 */
function reload() {
  pagingRef.value?.reload()
}

/** 确认群聊选择 */
function handleConfirm() {
  emit('update:modelValue', selected.value?.id)
  emit('change', selected.value)
  displayValue.value = selected.value?.name || ''
  visible.value = false
}

/** 清空群聊 */
function handleClear() {
  selected.value = undefined
  displayValue.value = ''
  emit('update:modelValue', undefined)
  emit('change', undefined)
}

/** 加载已选群名称 */
async function loadSelected() {
  if (!props.modelValue) {
    displayValue.value = ''
    return
  }
  const cached = list.value.find(item => item.id === props.modelValue)
  if (cached) {
    displayValue.value = cached.name
    return
  }
  const group = await getManagerGroup(props.modelValue)
  displayValue.value = group.name
  selected.value = group
}

/** 格式化群编号 */
function format(value?: number) {
  return !value || value === props.modelValue ? displayValue.value : `群 ${value}`
}

/** 监听群聊编号变化 */
watch(() => props.modelValue, loadSelected)

defineExpose({ format })

/** 初始化已选群聊 */
onMounted(loadSelected)
</script>
