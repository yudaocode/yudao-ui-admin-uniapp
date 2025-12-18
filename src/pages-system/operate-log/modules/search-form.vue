<template>
  <!-- 搜索框入口 -->
  <wd-search
    :placeholder="placeholder"
    :hide-cancel="true"
    disabled
    @click="visible = true"
  />

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
        搜索操作日志
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          操作人
        </view>
        <UserPicker
          ref="userPickerRef"
          v-model="formData.userId"
          type="radio"
          placeholder="请选择操作人员"
        />
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          操作模块
        </view>
        <wd-input
          v-model="formData.type"
          placeholder="请输入操作模块"
          clearable
        />
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          操作名
        </view>
        <wd-input
          v-model="formData.subType"
          placeholder="请输入操作名"
          clearable
        />
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          操作内容
        </view>
        <wd-input
          v-model="formData.action"
          placeholder="请输入操作内容"
          clearable
        />
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          操作时间
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
      <view class="mb-32rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          业务编号
        </view>
        <wd-input
          v-model="formData.bizId"
          placeholder="请输入业务编号"
          clearable
        />
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
import { computed, reactive, ref } from 'vue'
import UserPicker from '@/pages-system/user/form/components/user-picker.vue'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const userPickerRef = ref<InstanceType<typeof UserPicker>>()
const formData = reactive({
  userId: undefined as number | undefined,
  type: undefined as string | undefined,
  subType: undefined as string | undefined,
  action: undefined as string | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
  bizId: undefined as number | undefined,
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.userId !== undefined) {
    const nickname = userPickerRef.value?.getUserNickname(formData.userId)
    conditions.push(`操作人:${nickname || formData.userId}`)
  }
  if (formData.type) {
    conditions.push(`操作模块:${formData.type}`)
  }
  if (formData.subType) {
    conditions.push(`操作名:${formData.subType}`)
  }
  if (formData.action) {
    conditions.push(`操作内容:${formData.action}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`操作时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  if (formData.bizId !== undefined) {
    conditions.push(`业务编号:${formData.bizId}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索操作日志'
})

// 时间范围选择器状态
const visibleCreateTime = ref<[boolean, boolean]>([false, false])
const tempCreateTime = ref<[number, number]>([Date.now(), Date.now()])

/** 操作时间[0]确认 */
function handleCreateTime0Confirm() {
  formData.createTime = [tempCreateTime.value[0], formData.createTime?.[1]]
  visibleCreateTime.value[0] = false
}

/** 操作时间[0]取消 */
function handleCreateTime0Cancel() {
  visibleCreateTime.value[0] = false
}

/** 操作时间[1]确认 */
function handleCreateTime1Confirm() {
  formData.createTime = [formData.createTime?.[0], tempCreateTime.value[1]]
  visibleCreateTime.value[1] = false
}

/** 操作时间[1]取消 */
function handleCreateTime1Cancel() {
  visibleCreateTime.value[1] = false
}

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置 */
function handleReset() {
  formData.userId = undefined
  formData.type = undefined
  formData.subType = undefined
  formData.action = undefined
  formData.createTime = [undefined, undefined]
  formData.bizId = undefined
  visible.value = false
  emit('reset')
}


</script>
