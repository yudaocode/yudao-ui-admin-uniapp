<template>
  <!-- 搜索框入口 -->
  <view class="bg-white px-24rpx py-16rpx" @click="openSearch">
    <view class="flex items-center rounded-36rpx bg-[#f5f5f5] px-24rpx py-14rpx text-28rpx text-[#999]">
      <wd-icon name="search-line" size="32rpx" />
      <text class="ml-12rpx min-w-0 flex-1 truncate">
        {{ placeholder }}
      </text>
    </view>
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          方案编码
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入方案编码"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          方案名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入方案名称"
          clearable
        />
      </view>
      <yd-search-picker v-model="formData.type" label="方案类型" :dict-type="DICT_TYPE.MES_DV_SUBJECT_TYPE" all-option />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" all-option />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
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
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  code: '',
  name: '',
  type: undefined,
  status: undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`方案编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`方案名称:${formData.name}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`方案类型:${getDictLabel(DICT_TYPE.MES_DV_SUBJECT_TYPE, formData.type)}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_DV_CHECK_PLAN_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索点检方案'
})

/** 打开搜索弹窗 */
function openSearch() {
  visible.value = true
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    type: formData.type,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.type = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
