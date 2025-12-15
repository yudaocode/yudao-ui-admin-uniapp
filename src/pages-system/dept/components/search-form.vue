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
        搜索部门
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          部门名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入部门名称"
          clearable
        />
      </view>
      <view class="mb-32rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          状态
        </view>
        <wd-radio-group v-model="formData.status" shape="button" size="medium">
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
  name?: string
  status?: number
}

const props = defineProps<{
  searchParams?: Partial<SearchFormData> // 初始搜索参数
}>()

const emit = defineEmits<{
  'search': [data: SearchFormData]
  'reset': []
}>()

const visible = ref(false)

/** 搜索条件 placeholder 拼接 */
const searchPlaceholder = computed(() => {
  const conditions: string[] = []
  if (props.searchParams?.name) {
    conditions.push(`名称:${props.searchParams.name}`)
  }
  if (props.searchParams?.status !== undefined && props.searchParams.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, props.searchParams.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索部门'
})

const formData = reactive<SearchFormData>({
  name: undefined,
  status: -1,
})

/** 监听弹窗打开，同步外部参数 */
watch(visible, (val) => {
  if (val && props.searchParams) {
    formData.name = props.searchParams.name
    formData.status = props.searchParams.status !== undefined ? props.searchParams.status : -1
  }
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  const params = { ...formData }
  if (params.status === -1) {
    params.status = undefined
  }
  emit('search', params)
}

/** 重置 */
function handleReset() {
  formData.name = undefined
  formData.status = -1
  visible.value = false
  emit('reset')
}
</script>
