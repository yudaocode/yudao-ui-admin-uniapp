<template>
  <!-- 搜索框入口 -->
  <wd-search
    :placeholder="searchPlaceholder"
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
import { computed, reactive, ref, watch } from 'vue'

/** 搜索表单数据 */
export interface SearchFormData {
  username?: string
  nickname?: string
}

const props = defineProps<{
  searchParams?: Partial<SearchFormData> // 初始搜索参数
}>()

const emit = defineEmits<{
  search: [data: SearchFormData]
  reset: []
}>()

const visible = ref(false)

/** 搜索条件 placeholder 拼接 */
const searchPlaceholder = computed(() => {
  const conditions: string[] = []
  if (props.searchParams?.username) {
    conditions.push(`用户名:${props.searchParams.username}`)
  }
  if (props.searchParams?.nickname) {
    conditions.push(`昵称:${props.searchParams.nickname}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索用户'
})

const formData = reactive<SearchFormData>({
  username: undefined,
  nickname: undefined,
})

/** 监听弹窗打开，同步外部参数 */
watch(visible, (val) => {
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
