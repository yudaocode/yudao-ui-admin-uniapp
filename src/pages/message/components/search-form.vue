<template>
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
        搜索通知公告
      </view>

      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          公告标题
        </view>
        <wd-input
          v-model="formData.title"
          placeholder="请输入公告标题"
          clearable
        />
      </view>

      <view class="mb-32rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          公告状态（0正常 1关闭）
        </view>
        <wd-radio-group v-model="formData.status" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
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

import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'

/** 搜索表单数据 */
export interface SearchFormData {
  title?: string
  status?: number
}

const props = defineProps<{
  searchParams?: Partial<SearchFormData>
}>()

const emit = defineEmits<{
  search: [data: SearchFormData]
  reset: []
}>()

const visible = ref(false)
const formData = reactive<SearchFormData>({
  title: undefined,
  status: -1 as number,
})

/** 搜索条件 placeholder 拼接 */
const searchPlaceholder = computed(() => {
  const conditions: string[] = []
  if (props.searchParams?.title) {
    conditions.push(`公告标题:${props.searchParams.title}`)
  }
  if (props.searchParams?.status !== undefined && props.searchParams.status !== -1) {
    conditions.push(`公告状态（0正常 1关闭）:${getDictLabel(DICT_TYPE.COMMON_STATUS, props.searchParams.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索通知公告'
})

watch(visible, (val) => {
  if (val && props.searchParams) {
    formData.title = props.searchParams.title
    formData.status = props.searchParams.status ?? -1
  }
})

function handleSearch() {
  visible.value = false
  emit('search', { ...formData } as SearchFormData)
}

function handleReset() {
  formData.title = undefined
  formData.status = -1
  visible.value = false
  emit('reset')
}
</script>
