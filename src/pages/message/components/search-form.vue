<template>
  <!-- 搜索框入口 -->
  <view class="flex items-center bg-white pr-30rpx">
    <view class="flex-1">
      <wd-search
        :placeholder="searchPlaceholder"
        :hide-cancel="true"
        disabled
        @click="visible = true"
      />
    </view>
    <view class="text-28rpx text-[#1890ff]" @click="handleReadAll">
      全部已读
    </view>
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    custom-style="border-radius: 0 0 24rpx 24rpx;"
    safe-area-inset-top
    @close="visible = false"
  >
    <view class="p-32rpx">
      <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
        搜索消息
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          已读状态
        </view>
        <wd-radio-group v-model="formData.readStatus" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="1">
            已读
          </wd-radio>
          <wd-radio :value="0">
            未读
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="mb-32rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          发送时间
        </view>
        <view class="flex items-center gap-16rpx">
          <view class="flex-1" @click="visibleCreateTime[0] = true">
            <view
              class="h-72rpx flex items-center justify-center rounded-8rpx bg-[#f5f5f5] px-24rpx text-28rpx"
            >
              {{ formatDate(formData.createTime?.[0]) || '开始日期' }}
            </view>
          </view>
          <text class="text-28rpx text-[#999]">至</text>
          <view class="flex-1" @click="visibleCreateTime[1] = true">
            <view
              class="h-72rpx flex items-center justify-center rounded-8rpx bg-[#f5f5f5] px-24rpx text-28rpx"
            >
              {{ formatDate(formData.createTime?.[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker-view
          v-if="visibleCreateTime[0]"
          v-model="tempCreateTime[0]"
          type="date"
          :columns-height="200"
        />
        <view v-if="visibleCreateTime[0]" class="mt-16rpx flex justify-end gap-16rpx">
          <wd-button size="small" plain @click="handleCreateTime0Cancel">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime0Confirm">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view
          v-if="visibleCreateTime[1]"
          v-model="tempCreateTime[1]"
          type="date"
          :columns-height="200"
        />
        <view v-if="visibleCreateTime[1]" class="mt-16rpx flex justify-end gap-16rpx">
          <wd-button size="small" plain @click="handleCreateTime1Cancel">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime1Confirm">
            确定
          </wd-button>
        </view>
      </view>
      <view class="w-full flex justify-center gap-24rpx">
        <wd-button class="flex-1" plain @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { formatDate } from '@/utils/date'

/** 搜索表单数据 */
export interface SearchFormData {
  readStatus: number // -1 表示全部, 0 未读, 1 已读
  createTime?: [number | undefined, number | undefined]
}

const props = defineProps<{
  searchParams?: Partial<SearchFormData> // 初始搜索参数
}>()

const emit = defineEmits<{
  search: [data: SearchFormData]
  reset: []
  readAll: []
}>()

const visible = ref(false)
const formData = reactive<SearchFormData>({
  readStatus: -1,
  createTime: [undefined, undefined],
})

/** 搜索条件 placeholder 拼接 */
const searchPlaceholder = computed(() => {
  const conditions: string[] = []
  if (props.searchParams?.readStatus === 1) {
    conditions.push('已读')
  } else if (props.searchParams?.readStatus === 0) {
    conditions.push('未读')
  }
  if (props.searchParams?.createTime?.[0] && props.searchParams?.createTime?.[1]) {
    conditions.push(`${formatDate(props.searchParams.createTime[0])}~${formatDate(props.searchParams.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索消息'
})

/** 全部已读 */
function handleReadAll() {
  emit('readAll')
}

// 时间选择器状态
const visibleCreateTime = ref<[boolean, boolean]>([false, false])
const tempCreateTime = ref<[number, number]>([Date.now(), Date.now()])

/** 创建时间[0]确认 */
function handleCreateTime0Confirm() {
  formData.createTime = [tempCreateTime.value[0], formData.createTime?.[1]]
  visibleCreateTime.value[0] = false
}

/** 创建时间[0]取消 */
function handleCreateTime0Cancel() {
  visibleCreateTime.value[0] = false
}

/** 创建时间[1]确认 */
function handleCreateTime1Confirm() {
  formData.createTime = [formData.createTime?.[0], tempCreateTime.value[1]]
  visibleCreateTime.value[1] = false
}

/** 创建时间[1]取消 */
function handleCreateTime1Cancel() {
  visibleCreateTime.value[1] = false
}

/** 监听弹窗打开，同步外部参数 */
watch(visible, (val) => {
  if (val && props.searchParams) {
    formData.readStatus = props.searchParams.readStatus ?? -1
    formData.createTime = props.searchParams.createTime ?? [undefined, undefined]
  }
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置 */
function handleReset() {
  formData.readStatus = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
