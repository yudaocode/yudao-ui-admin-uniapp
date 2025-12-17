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
        搜索日志
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          用户编号
        </view>
        <wd-input
          v-model="formData.userId"
          placeholder="请输入用户编号"
          clearable
        />
      </view>
      <view class="mb-32rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          应用名
        </view>
        <wd-input
          v-model="formData.applicationName"
          placeholder="请输入应用名"
          clearable
        />
      </view>
      <!-- TODO @芋艿：后续增加时间范围的检索 -->
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

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const formData = reactive({
  userId: undefined as number | undefined,
  applicationName: undefined as string | undefined,
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.userId) {
    conditions.push(`用户编号:${formData.userId}`)
  }
  if (formData.applicationName) {
    conditions.push(`应用名:${formData.applicationName}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索日志'
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置 */
function handleReset() {
  formData.userId = undefined
  formData.applicationName = undefined
  visible.value = false
  emit('reset')
}
</script>
