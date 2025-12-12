<template>
  <wd-popup
    v-model="visible"
    position="top"
    custom-style="border-radius: 0 0 24rpx 24rpx;"
    safe-area-inset-top
    @close="visible = false"
  >
    <view class="p-32rpx">
      <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
        搜索用户
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          用户名称
        </view>
        <wd-input
          v-model="formData.username"
          placeholder="请输入用户名称"
          clearable
        />
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          用户昵称
        </view>
        <wd-input
          v-model="formData.nickname"
          placeholder="请输入用户昵称"
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
import { computed, reactive, watch } from 'vue'

/** 搜索表单数据 */
export interface SearchFormData {
  username?: string
  nickname?: string
}

const props = defineProps<{
  modelValue: boolean
  searchParams?: Partial<SearchFormData> // 初始搜索参数
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'search': [data: SearchFormData]
  'reset': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const formData = reactive<SearchFormData>({
  username: undefined,
  nickname: undefined,
})

/** 监听弹窗打开，同步外部参数 */
watch(() => props.modelValue, (val) => {
  if (val && props.searchParams) {
    formData.username = props.searchParams.username
    formData.nickname = props.searchParams.nickname
  }
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置 */
function handleReset() {
  formData.username = undefined
  formData.nickname = undefined
  visible.value = false
  emit('reset')
}
</script>
