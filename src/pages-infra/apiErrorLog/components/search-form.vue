<template>
  <!-- 搜索框入口 -->
  <wd-search
    :placeholder="searchPlaceholder"
    :hide-cancel="true"
    disabled
    @click="visible = true"
  />

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
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          应用名
        </view>
        <wd-input
          v-model="formData.applicationName"
          placeholder="请输入应用名"
          clearable
        />
      </view>
      <view class="mb-32rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          处理状态
        </view>
        <wd-radio-group v-model="formData.processStatus" shape="button" size="medium">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="0">
            未处理
          </wd-radio>
          <wd-radio :value="1">
            已处理
          </wd-radio>
          <wd-radio :value="2">
            已忽略
          </wd-radio>
        </wd-radio-group>
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
  userId?: number
  applicationName?: string
  processStatus: number // -1 表示全部
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
  if (props.searchParams?.userId) {
    conditions.push(`用户编号:${props.searchParams.userId}`)
  }
  if (props.searchParams?.applicationName) {
    conditions.push(`应用名:${props.searchParams.applicationName}`)
  }
  if (props.searchParams?.processStatus !== undefined && props.searchParams?.processStatus !== -1) {
    const statusMap: Record<number, string> = { 0: '未处理', 1: '已处理', 2: '已忽略' }
    conditions.push(`状态:${statusMap[props.searchParams.processStatus]}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索日志'
})

const formData = reactive<SearchFormData>({
  userId: undefined,
  applicationName: undefined,
  processStatus: -1,
})

/** 监听弹窗打开，同步外部参数 */
watch(visible, (val) => {
  if (val && props.searchParams) {
    formData.userId = props.searchParams.userId
    formData.applicationName = props.searchParams.applicationName
    formData.processStatus = props.searchParams.processStatus ?? -1
  }
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
  formData.processStatus = -1
  visible.value = false
  emit('reset')
}
</script>
